import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type { CartItem } from '@/types'

interface CartCheckoutBody {
  items: CartItem[]
  discountRate: number
  userId: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CartCheckoutBody
    const { items, discountRate, userId } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 })
    }

    const lineItems = items.map((item) => {
      const discountedPrice = Math.round(item.finalPrice * (1 - discountRate))
      return {
        quantity: 1,
        price_data: {
          currency: 'brl',
          unit_amount: discountedPrice * 100,
          product_data: {
            name: item.productName,
            description: item.briefing.substring(0, 500),
          },
        },
      }
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projetos?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/carrinho`,
      metadata: {
        userId,
        itemCount: items.length.toString(),
        source: 'dashboard_cart',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[checkout/cart]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
