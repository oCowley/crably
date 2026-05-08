import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { db } from '@/lib/firebase'
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const ABACATEPAY_PUBLIC_KEY =
  't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9'

function verifySignature(rawBody: string, signatureFromHeader: string): boolean {
  const bodyBuffer = Buffer.from(rawBody, 'utf8')
  const expectedSig = crypto
    .createHmac('sha256', ABACATEPAY_PUBLIC_KEY)
    .update(bodyBuffer)
    .digest('base64')

  const A = Buffer.from(expectedSig)
  const B = Buffer.from(signatureFromHeader)

  return A.length === B.length && crypto.timingSafeEqual(A, B)
}

interface WebhookPayload {
  id: string
  event: string
  apiVersion: number
  devMode: boolean
  data: {
    metadata?: Record<string, string>
    [key: string]: unknown
  }
}

export async function POST(req: NextRequest) {
  // Layer 1: Verify webhook secret in query string
  const webhookSecret = req.nextUrl.searchParams.get('webhookSecret')
  if (webhookSecret !== process.env.ABACATEPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Layer 2: Verify HMAC-SHA256 signature
  const rawBody = await req.text()
  const signature = req.headers.get('x-webhook-signature')

  if (!signature || !verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = JSON.parse(rawBody) as WebhookPayload

  if (payload.event === 'checkout.completed') {
    const meta = payload.data.metadata ?? {}
    const userId = meta.userId
    const orderIds = (meta.orderIds ?? '').split(',').filter(Boolean)

    try {
      // Atualiza cada pedido de 'pending_payment' → 'aguardando'
      await Promise.all(
        orderIds.map((orderId) =>
          updateDoc(doc(db, 'orders', orderId), {
            status: 'aguardando',
            projectStage: 'briefing',
            updatedAt: serverTimestamp(),
          })
        )
      )

      // Revisão paga: move o pedido para em_revisao
      if (meta.type === 'revision' && meta.orderId) {
        await updateDoc(doc(db, 'orders', meta.orderId), {
          projectStage: 'em_revisao',
          revisionPaid: true,
          updatedAt: serverTimestamp(),
        })
      }

      // Marca primeira compra como concluída
      if (userId) {
        await setDoc(
          doc(db, 'users', userId),
          { firstPurchaseDone: true, updatedAt: serverTimestamp() },
          { merge: true }
        )
      }
    } catch (err) {
      console.error('[webhook] Erro no Firestore', err)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
