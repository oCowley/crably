import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateProduct, createCheckout } from '@/lib/abacatepay'
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

    const checkoutItems = await Promise.all(
      items.map(async (item) => {
        const discountedPrice = Math.round(item.finalPrice * (1 - discountRate))
        const priceInCents = Math.round(discountedPrice * 100)
        const externalId = `${item.productType}_${priceInCents}`
        const product = await getOrCreateProduct(item.productName, priceInCents, externalId)
        return { id: product.id, quantity: 1 }
      })
    )

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const checkout = await createCheckout({
      items: checkoutItems,
      returnUrl: `${appUrl}/dashboard/projetos?checkout=success`,
      completionUrl: `${appUrl}/api/webhook`,
      methods: ['PIX', 'CARD'],
      metadata: {
        userId,
        itemCount: items.length.toString(),
        source: 'dashboard_cart',
      },
    })

    return NextResponse.json({ url: checkout.url })
  } catch (error) {
    console.error('[checkout/cart]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
