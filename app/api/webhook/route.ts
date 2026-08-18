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
  checkout?: {
    id: string
    status?: string
  }
}

export async function POST(req: NextRequest) {
  // O Asaas envia de volta o token de autenticação definido ao configurar o webhook
  const token = req.headers.get('asaas-access-token')
  if (!process.env.ASAAS_WEBHOOK_TOKEN || token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = (await req.json()) as AsaasWebhookPayload

  if (payload.event === 'CHECKOUT_PAID' && payload.checkout?.id) {
    const checkoutId = payload.checkout.id

    try {
      // Fluxo principal: pedidos vinculados a esta sessão de checkout
      const ordersSnap = await getDocs(
        query(collection(db, 'orders'), where('checkoutId', '==', checkoutId))
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
      } else {
        // Fluxo de revisão: pedido com revisionCheckoutId vinculado a esta sessão
        const revisionSnap = await getDocs(
          query(collection(db, 'orders'), where('revisionCheckoutId', '==', checkoutId))
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
    } catch (err) {
      console.error('[webhook] Erro no Firestore', err)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
