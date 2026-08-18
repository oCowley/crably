import { NextRequest, NextResponse } from 'next/server'
import { createCheckout, getCallbackBaseUrl } from '@/lib/asaas'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const snap = await getDoc(doc(db, 'orders', id))
  if (!snap.exists()) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  try {
    const appUrl = getCallbackBaseUrl()
    const checkout = await createCheckout({
      items: [{ name: 'Revisão do projeto', quantity: 1, value: 297 }],
      successUrl: `${appUrl}/dashboard/projetos/${id}?revisao=paga`,
      cancelUrl: `${appUrl}/dashboard/projetos/${id}`,
      externalReference: `revision:${id}`,
    })

    // O webhook identifica o pagamento de revisão por este campo
    await updateDoc(doc(db, 'orders', id), {
      revisionCheckoutId: checkout.id,
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({ url: checkout.link })
  } catch (err) {
    console.error('Asaas error:', err)
    return NextResponse.json({ error: 'Falha ao criar sessão de pagamento' }, { status: 500 })
  }
}
