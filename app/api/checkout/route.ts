import { NextRequest, NextResponse } from 'next/server'
import {
  createCheckout,
  createPixPayment,
  getOrCreateCustomer,
  getPixQrCode,
  getCallbackBaseUrl,
} from '@/lib/asaas'
import { db } from '@/lib/firebase'
import {
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import type { CartItem } from '@/types'

interface CheckoutBody {
  items: CartItem[]
  userId: string
  userEmail: string
  method: 'pix' | 'card'
  // Obrigatórios para PIX (cobrança transparente exige customer com CPF)
  buyerName?: string
  buyerCpf?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody
    const { items, userId, userEmail, method, buyerName, buyerCpf } = body

    if (!items?.length || !userId || !userEmail) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }
    if (method === 'pix' && !buyerCpf) {
      return NextResponse.json({ error: 'CPF obrigatório para PIX' }, { status: 400 })
    }

    // 1. Persiste os pedidos no Firestore ANTES do pagamento
    // O preço já vem com desconto aplicado pelo cliente
    const orderRefs = await Promise.all(
      items.map((item) => {
        return addDoc(collection(db, 'orders'), {
          userId,
          productName: item.productName,
          productType: item.productType,
          projectName: item.projectName,
          briefing: item.briefing,
          reference: item.reference,
          prazo: item.prazo,
          price: item.finalPrice,
          status: 'pending_payment',
          deliveryUrl: null,
          checkoutId: '',
          createdAt: serverTimestamp(),
        })
      })
    )

    const orderIds = orderRefs.map((r) => r.id).join(',')
    const total = items.reduce((sum, item) => sum + item.finalPrice, 0)

    // 2a. PIX transparente: cobrança avulsa, QR Code exibido no nosso site
    if (method === 'pix') {
      try {
        const customer = await getOrCreateCustomer(
          buyerName || userEmail.split('@')[0],
          buyerCpf!,
          userEmail
        )
        const payment = await createPixPayment({
          customerId: customer.id,
          value: total,
          description: `Crably — ${items.map((i) => i.projectName).join(', ')}`,
          externalReference: orderIds,
        })

        // checkoutId guarda o id do gateway (pay_... no PIX, uuid no checkout hospedado)
        await Promise.all(
          orderRefs.map((ref) => updateDoc(ref, { checkoutId: payment.id }))
        )

        const qr = await getPixQrCode(payment.id)
        return NextResponse.json({
          pix: {
            paymentId: payment.id,
            qrCodeImage: qr.encodedImage,
            copiaECola: qr.payload,
            expiresAt: qr.expirationDate,
          },
        })
      } catch (err) {
        // Conta ainda sem permissão para emitir cobrança avulsa via API:
        // cai para o checkout hospedado com PIX (o cliente paga na página do Asaas)
        const msg = err instanceof Error ? err.message : ''
        if (!msg.includes('não será possível emitir')) throw err
        console.warn('[checkout] Emissão de cobrança bloqueada na conta Asaas — usando checkout hospedado como fallback.')
      }
    }

    // 2b. Checkout hospedado do Asaas (redirect):
    // cartão sempre; PIX apenas como fallback do fluxo transparente
    const appUrl = getCallbackBaseUrl()
    const checkout = await createCheckout({
      items: items.map((item) => ({
        name: item.productName,
        description: item.projectName,
        quantity: 1,
        value: item.finalPrice,
      })),
      billingTypes: method === 'pix' ? ['PIX', 'CREDIT_CARD'] : ['CREDIT_CARD'],
      successUrl: `${appUrl}/dashboard/projetos?success=true`,
      cancelUrl: `${appUrl}/dashboard/carrinho`,
      externalReference: orderIds,
      // customerData omitido de propósito: se enviado, o Asaas exige cadastro
      // completo (telefone, endereço, CEP...) — o pagador preenche no checkout
    })

    await Promise.all(
      orderRefs.map((ref) => updateDoc(ref, { checkoutId: checkout.id }))
    )

    return NextResponse.json({ url: checkout.link })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[checkout] ERRO:', msg)
    return NextResponse.json({ error: `Erro no checkout: ${msg}` }, { status: 500 })
  }
}
