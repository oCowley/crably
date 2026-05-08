import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateProduct, createCheckout } from '@/lib/abacatepay'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const snap = await getDoc(doc(db, 'orders', id))
  if (!snap.exists()) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  try {
    const product = await getOrCreateProduct('Revisão do projeto', 29700, 'revision_29700')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const checkout = await createCheckout({
      items: [{ id: product.id, quantity: 1 }],
      returnUrl: `${appUrl}/dashboard/projetos/${id}?revisao=paga`,
      completionUrl: `${appUrl}/api/webhook`,
      methods: ['PIX', 'CARD'],
      metadata: { orderId: id, type: 'revision' },
    })

    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    console.error('AbacatePay error:', err)
    return NextResponse.json({ error: 'Falha ao criar sessão de pagamento' }, { status: 500 })
  }
}
