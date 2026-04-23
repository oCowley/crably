import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/firebase'
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  // Em produção: STRIPE_WEBHOOK_SECRET vem do endpoint real configurado no Stripe Dashboard
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('[webhook] Assinatura inválida', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata ?? {}
    const userId = meta.userId ?? session.client_reference_id
    const orderIds = (meta.orderIds ?? '').split(',').filter(Boolean)

    try {
      // Atualiza cada pedido de 'pending_payment' → 'aguardando'
      // Os pedidos já existem no Firestore com todos os dados (criados em /api/checkout)
      await Promise.all(
        orderIds.map((orderId) =>
          updateDoc(doc(db, 'orders', orderId), {
            status: 'aguardando',        // keep for admin pedidos page backward compat
            projectStage: 'briefing',    // new field for the project flow
            updatedAt: serverTimestamp(),
          })
        )
      )

      // Marca primeira compra como concluída no perfil do usuário
      if (userId) {
        await setDoc(
          doc(db, 'users', userId),
          { firstPurchaseDone: true, updatedAt: serverTimestamp() },
          { merge: true }
        )
      }
    } catch (err) {
      console.error('[webhook] Erro no Firestore', err)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
