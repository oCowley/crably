import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const snap = await getDoc(doc(db, 'orders', id))
  if (!snap.exists()) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'brl',
        unit_amount: 29700,
        product_data: {
          name: 'Revisão do projeto',
          description: 'Inclui meet de alinhamento + ajustes no projeto + 5 dias úteis adicionais',
        },
      },
    }],
    client_reference_id: id,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projetos/${id}?revisao=paga`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projetos/${id}`,
    metadata: { orderId: id, type: 'revision' },
  })

  return NextResponse.json({ url: session.url })
}
