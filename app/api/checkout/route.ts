import { NextRequest, NextResponse } from 'next/server'
import { createCheckout, getCallbackBaseUrl } from '@/lib/asaas'
import { db } from '@/lib/firebase'
import {
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

    // 1. Persiste os pedidos no Firestore ANTES do checkout
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

    // 2. Cria checkout no Asaas (items inline, valores em reais)
    const appUrl = getCallbackBaseUrl()
    const checkout = await createCheckout({
      items: items.map((item) => ({
        name: item.productName,
        description: item.projectName,
        quantity: 1,
        value: item.finalPrice,
      })),
      successUrl: `${appUrl}/dashboard/projetos?success=true`,
      cancelUrl: `${appUrl}/dashboard/carrinho`,
      externalReference: orderIds,
      // customerData omitido de propósito: se enviado, o Asaas exige cadastro
      // completo (telefone, endereço, CEP...) — o pagador preenche no checkout
    })

    // 3. Vincula o checkoutId aos pedidos criados
    await Promise.all(
      orderRefs.map((ref) =>
        updateDoc(ref, { checkoutId: checkout.id })
      )
    )

    return NextResponse.json({ url: checkout.link })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[checkout] ERRO:', msg)
    return NextResponse.json({ error: `Erro no checkout: ${msg}` }, { status: 500 })
  }
}
