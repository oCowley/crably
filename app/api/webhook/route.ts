import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import {
  doc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  collection,
  where,
  serverTimestamp,
} from 'firebase/firestore'

interface AsaasWebhookPayload {
  id: string
  event: string
  checkout?: { id: string }
  payment?: { id: string }
}

/**
 * Marca como pagos os pedidos vinculados a um id do gateway
 * (checkoutId = sessão hospedada ou cobrança PIX pay_...).
 */
async function markOrdersPaid(gatewayId: string) {
  // Fluxo principal
  const ordersSnap = await getDocs(
    query(collection(db, 'orders'), where('checkoutId', '==', gatewayId))
  )

  if (!ordersSnap.empty) {
    await Promise.all(
      ordersSnap.docs.map((d) =>
        updateDoc(d.ref, {
          status: 'aguardando',
          projectStage: 'briefing',
          updatedAt: serverTimestamp(),
        })
      )
    )

    // Marca primeira compra como concluída
    const userId = ordersSnap.docs[0].data().userId as string | undefined
    if (userId) {
      await setDoc(
        doc(db, 'users', userId),
        { firstPurchaseDone: true, updatedAt: serverTimestamp() },
        { merge: true }
      )
    }
    return
  }

  // Fluxo de revisão
  const revisionSnap = await getDocs(
    query(collection(db, 'orders'), where('revisionCheckoutId', '==', gatewayId))
  )
  await Promise.all(
    revisionSnap.docs.map((d) =>
      updateDoc(d.ref, {
        projectStage: 'em_revisao',
        revisionPaid: true,
        updatedAt: serverTimestamp(),
      })
    )
  )
}

export async function POST(req: NextRequest) {
  // O Asaas envia de volta o token de autenticação definido ao configurar o webhook
  const token = req.headers.get('asaas-access-token')
  if (!process.env.ASAAS_WEBHOOK_TOKEN || token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = (await req.json()) as AsaasWebhookPayload

  try {
    // Checkout hospedado (cartão)
    if (payload.event === 'CHECKOUT_PAID' && payload.checkout?.id) {
      await markOrdersPaid(payload.checkout.id)
    }

    // Cobrança avulsa (PIX transparente): RECEIVED = dinheiro caiu,
    // CONFIRMED = pagamento confirmado (cartão)
    if (
      (payload.event === 'PAYMENT_RECEIVED' || payload.event === 'PAYMENT_CONFIRMED') &&
      payload.payment?.id
    ) {
      await markOrdersPaid(payload.payment.id)
    }
  } catch (err) {
    console.error('[webhook] Erro no Firestore', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
