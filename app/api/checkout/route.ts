import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { productId, productName, price } = await req.json()

    if (!productId || !productName || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'brl',
            unit_amount: price,
            product_data: {
              name: productName,
              description: 'Crably — Premium website template',
            },
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${productId}`,
      metadata: { productId },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[checkout]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
