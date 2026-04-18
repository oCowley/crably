import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
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

// Em produção: trocar STRIPE_SECRET_KEY=sk_test_... por sk_live_... no .env
const COUPON_ID = 'PRIMEIRA_COMPRA_30'

interface CheckoutBody {
  items: CartItem[]
  userId: string
  userEmail: string
}

async function ensureFirstPurchaseCoupon(): Promise<string> {
  try {
    await stripe.coupons.retrieve(COUPON_ID)
    return COUPON_ID
  } catch (err) {
    const raw = err as { code?: string }
    if (raw.code === 'resource_missing') {
      await stripe.coupons.create({
        id: COUPON_ID,
        percent_off: 30,
        duration: 'once',
        name: 'Desconto primeira compra — 30%',
      })
      return COUPON_ID
    }
    throw err
  }
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

    // 2. Persiste os pedidos no Firestore ANTES do Stripe (dados completos, sem truncar)
    //    status: 'pending_payment' — será atualizado para 'aguardando' pelo webhook
    const orderRefs = await Promise.all(
      items.map((item) =>
        addDoc(collection(db, 'orders'), {
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
          stripeSessionId: '',
          createdAt: serverTimestamp(),
        })
      )
    )

    const orderIds = orderRefs.map((r) => r.id).join(',')

    // 3. Monta line_items em centavos (BRL)
    const lineItems = items.map((item) => ({
      quantity: 1,
      price_data: {
        currency: 'brl',
        unit_amount: Math.round(item.finalPrice * 100),
        product_data: {
          name: item.productName,
          description: item.briefing.slice(0, 500),
        },
      },
    }))

    const discounts = isFirstPurchase
      ? [{ coupon: await ensureFirstPurchaseCoupon() }]
      : []

    // 4. Cria a Checkout Session no Stripe
    // Em produção: NEXT_PUBLIC_APP_URL deve ser o domínio real (ex: https://crably.com)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      ...(discounts.length > 0 && { discounts }),
      customer_email: userEmail,
      client_reference_id: userId,
      // {CHECKOUT_SESSION_ID} é substituído pelo Stripe com o ID real da session
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projetos?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/carrinho?cancelled=true`,
      metadata: {
        userId,
        orderIds, // IDs dos pedidos já criados no Firestore
      },
    })

    // 5. Vincula o stripeSessionId aos pedidos criados
    await Promise.all(
      orderRefs.map((ref) =>
        updateDoc(ref, { stripeSessionId: session.id })
      )
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[checkout]', error)
    return NextResponse.json({ error: 'Erro interno no checkout' }, { status: 500 })
  }
}
