import { NextRequest, NextResponse } from 'next/server'
import { isCheckoutPaid, isPaymentPaid } from '@/lib/asaas'
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

interface ConfirmBody {
  sessionId: string
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = (await req.json()) as ConfirmBody

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId obrigatório' }, { status: 400 })
    }

    // pay_... = cobrança PIX transparente; uuid = sessão do checkout hospedado
    const paid = sessionId.startsWith('pay_')
      ? await isPaymentPaid(sessionId)
      : await isCheckoutPaid(sessionId)
    if (!paid) {
      return NextResponse.json({ status: 'unpaid' })
    }

    const ordersSnap = await getDocs(
      query(collection(db, 'orders'), where('checkoutId', '==', sessionId))
    )

    if (ordersSnap.empty) {
      return NextResponse.json({ status: 'no_orders' })
    }

    // Atualiza pedidos para 'aguardando' (idempotente)
    await Promise.all(
      ordersSnap.docs.map((d) =>
        updateDoc(d.ref, {
          status: 'aguardando',
          projectStage: 'briefing',
          updatedAt: serverTimestamp(),
        })
      )
    )

    const userId = ordersSnap.docs[0].data().userId as string | undefined
    if (userId) {
      await setDoc(
        doc(db, 'users', userId),
        { firstPurchaseDone: true, updatedAt: serverTimestamp() },
        { merge: true }
      )
    }

    return NextResponse.json({ status: 'confirmed', orderCount: ordersSnap.size })
  } catch (error) {
    console.error('[checkout/confirm]', error)
    return NextResponse.json({ error: 'Erro ao confirmar pagamento' }, { status: 500 })
  }
}
