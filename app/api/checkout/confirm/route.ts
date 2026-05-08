import { NextRequest, NextResponse } from 'next/server'
import { getCheckout } from '@/lib/abacatepay'
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

    const checkout = await getCheckout(sessionId)

    if (checkout.status !== 'PAID') {
      return NextResponse.json({ status: 'unpaid' })
    }

    const orderIds = (checkout.metadata?.orderIds ?? '').split(',').filter(Boolean)
    const userId = checkout.metadata?.userId

    if (orderIds.length === 0) {
      return NextResponse.json({ status: 'no_orders' })
    }

    // Atualiza pedidos para 'aguardando' (idempotente)
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
