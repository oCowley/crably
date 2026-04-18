import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/firebase'
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'

interface ConfirmBody {
  sessionId: string
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = (await req.json()) as ConfirmBody

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId obrigatório' }, { status: 400 })
    }

    // Consulta o status real da session no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ status: 'unpaid' })
    }

    const orderIds = (session.metadata?.orderIds ?? '').split(',').filter(Boolean)
    const userId = session.metadata?.userId ?? session.client_reference_id

    if (orderIds.length === 0) {
      return NextResponse.json({ status: 'no_orders' })
    }

    // Atualiza pedidos para 'aguardando' (idempotente — seguro rodar N vezes)
    await Promise.all(
      orderIds.map((id) =>
        updateDoc(doc(db, 'orders', id), {
          status: 'aguardando',
          updatedAt: serverTimestamp(),
        })
      )
    )

    if (userId) {
      await setDoc(
        doc(db, 'users', userId),
        { firstPurchaseDone: true, updatedAt: serverTimestamp() },
        { merge: true }
      )
    }

    return NextResponse.json({ status: 'confirmed', orderCount: orderIds.length })
  } catch (error) {
    console.error('[checkout/confirm]', error)
    return NextResponse.json({ error: 'Erro ao confirmar pagamento' }, { status: 500 })
  }
}
