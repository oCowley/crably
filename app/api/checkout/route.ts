import { NextRequest, NextResponse } from 'next/server'
import { createCustomer, getOrCreateProduct, createCheckout } from '@/lib/abacatepay'
import { db } from '@/lib/firebase'
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import type { CartItem } from '@/types'

interface CheckoutBody {
  items: CartItem[]
  userId: string
  userEmail: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody
    const { items, userId, userEmail } = body

    if (!items?.length || !userId || !userEmail) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // 1. Busca dados do usuário
    const userSnap = await getDoc(doc(db, 'users', userId))
    const userCpf = userSnap.exists() ? (userSnap.data().cpf as string | undefined) : undefined
    const userName = userSnap.exists() ? (userSnap.data().name as string | undefined) : undefined

    // 2. Cria customer no Abacate Pay
    const customer = await createCustomer(userEmail, userCpf, userName)

    // 3. Persiste os pedidos no Firestore ANTES do checkout
    // O preço já vem com desconto aplicado pelo cliente
    const orderRefs = await Promise.all(
      items.map((item) => {
        return addDoc(collection(db, 'orders'), {
          userId,
          productName: item.productName,
          productType: item.productType,
          projectName: item.projectName,
          briefing: item.briefing,
          reference: item.reference,
          prazo: item.prazo,
          price: item.finalPrice,
          status: 'pending_payment',
          deliveryUrl: null,
          checkoutId: '',
          createdAt: serverTimestamp(),
        })
      })
    )

    const orderIds = orderRefs.map((r) => r.id).join(',')

    // 4. Cria products on-the-fly no Abacate Pay e monta items do checkout
    const checkoutItems = await Promise.all(
      items.map(async (item) => {
        const priceInCents = Math.round(item.finalPrice * 100)
        const externalId = `${item.productType}_${priceInCents}`
        const product = await getOrCreateProduct(item.productName, priceInCents, externalId)
        return { id: product.id, quantity: 1 }
      })
    )

    // 5. Cria checkout no Abacate Pay
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const checkout = await createCheckout({
      items: checkoutItems,
      returnUrl: `${appUrl}/dashboard/projetos?success=true`,
      completionUrl: `${appUrl}/api/webhook`,
      customerId: customer.id,
      methods: ['PIX', 'CARD'],
      metadata: { userId, orderIds },
    })

    // 6. Vincula o checkoutId aos pedidos criados
    await Promise.all(
      orderRefs.map((ref) =>
        updateDoc(ref, { checkoutId: checkout.id })
      )
    )

    return NextResponse.json({ url: checkout.url })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[checkout] ERRO:', msg)
    return NextResponse.json({ error: `Erro no checkout: ${msg}` }, { status: 500 })
  }
}
