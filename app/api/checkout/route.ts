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

    // 1. Verifica se é primeira compra
    const userSnap = await getDoc(doc(db, 'users', userId))
    const firstPurchaseDone: boolean = userSnap.exists()
      ? ((userSnap.data().firstPurchaseDone as boolean | undefined) ?? false)
      : false
    const isFirstPurchase = !firstPurchaseDone

    // 2. Busca CPF do usuário para criar customer no Abacate Pay
    const userCpf = userSnap.exists() ? (userSnap.data().cpf as string | undefined) : undefined
    const userName = userSnap.exists() ? (userSnap.data().name as string | undefined) : undefined

    // 3. Cria customer no Abacate Pay
    const customer = await createCustomer(userEmail, userCpf, userName)

    // 4. Aplica desconto de primeira compra no servidor (30%)
    const discountRate = isFirstPurchase ? 0.3 : 0

    // 5. Persiste os pedidos no Firestore ANTES do checkout
    const orderRefs = await Promise.all(
      items.map((item) => {
        const discountedPrice = Math.round(item.finalPrice * (1 - discountRate))
        return addDoc(collection(db, 'orders'), {
          userId,
          productName: item.productName,
          productType: item.productType,
          projectName: item.projectName,
          briefing: item.briefing,
          reference: item.reference,
          prazo: item.prazo,
          price: discountedPrice,
          status: 'pending_payment',
          deliveryUrl: null,
          checkoutId: '',
          createdAt: serverTimestamp(),
        })
      })
    )

    const orderIds = orderRefs.map((r) => r.id).join(',')

    // 6. Cria products on-the-fly no Abacate Pay e monta items do checkout
    const checkoutItems = await Promise.all(
      items.map(async (item) => {
        const discountedPrice = Math.round(item.finalPrice * (1 - discountRate))
        const priceInCents = Math.round(discountedPrice * 100)
        const externalId = `${item.productType}_${priceInCents}`
        const product = await getOrCreateProduct(item.productName, priceInCents, externalId)
        return { id: product.id, quantity: 1 }
      })
    )

    // 7. Cria checkout no Abacate Pay
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const checkout = await createCheckout({
      items: checkoutItems,
      returnUrl: `${appUrl}/dashboard/projetos?success=true`,
      completionUrl: `${appUrl}/api/webhook`,
      customerId: customer.id,
      methods: ['PIX', 'CARD'],
      metadata: { userId, orderIds },
    })

    // 8. Vincula o checkoutId aos pedidos criados
    await Promise.all(
      orderRefs.map((ref) =>
        updateDoc(ref, { checkoutId: checkout.id })
      )
    )

    return NextResponse.json({ url: checkout.url })
  } catch (error) {
    console.error('[checkout]', error)
    return NextResponse.json({ error: 'Erro interno no checkout' }, { status: 500 })
  }
}
