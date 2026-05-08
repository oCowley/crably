# Abacate Pay Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Stripe with Abacate Pay as the sole payment gateway, keeping the same redirect-based checkout flow.

**Architecture:** REST API client (`lib/abacatepay.ts`) wrapping `fetch` calls to `https://api.abacatepay.com/v2`. Products created on-the-fly at checkout time. Discounts calculated server-side before sending to Abacate Pay. Webhook validates via query secret + HMAC-SHA256 signature.

**Tech Stack:** Next.js 16 App Router, Abacate Pay REST API v2, Firebase/Firestore, TypeScript

---

### Task 1: Create Abacate Pay client library

**Files:**
- Create: `lib/abacatepay.ts`

- [ ] **Step 1: Create `lib/abacatepay.ts`**

```typescript
const BASE_URL = 'https://api.abacatepay.com/v2'

function getApiKey(): string {
  const key = process.env.ABACATEPAY_SECRET_KEY
  if (!key) throw new Error('ABACATEPAY_SECRET_KEY is not set')
  return key
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const json = await res.json()

  if (!json.success && json.error) {
    throw new Error(`AbacatePay error: ${json.error}`)
  }

  return json.data as T
}

// --- Customers ---

interface AbacateCustomer {
  id: string
  email: string
  name?: string
  cellphone?: string
  taxId?: string
}

export async function createCustomer(
  email: string,
  taxId?: string,
  name?: string
): Promise<AbacateCustomer> {
  return request<AbacateCustomer>('POST', '/customers/create', {
    email,
    ...(taxId ? { taxId } : {}),
    ...(name ? { name } : {}),
  })
}

// --- Products ---

interface AbacateProduct {
  id: string
  externalId: string
  name: string
  price: number
  currency: string
}

export async function createProduct(
  name: string,
  price: number,
  externalId: string
): Promise<AbacateProduct> {
  return request<AbacateProduct>('POST', '/products/create', {
    externalId,
    name,
    price, // centavos
    currency: 'BRL',
  })
}

export async function listProducts(externalId: string): Promise<AbacateProduct[]> {
  return request<AbacateProduct[]>('GET', `/products/list?externalId=${encodeURIComponent(externalId)}`)
}

export async function getOrCreateProduct(
  name: string,
  price: number,
  externalId: string
): Promise<AbacateProduct> {
  const products = await listProducts(externalId)
  const existing = products.find((p) => p.price === price)
  if (existing) return existing
  return createProduct(name, price, externalId)
}

// --- Checkouts ---

interface AbacateCheckoutItem {
  id: string // product id
  quantity: number
}

interface AbacateCheckoutOptions {
  items: AbacateCheckoutItem[]
  returnUrl: string
  completionUrl: string
  customerId?: string
  methods?: ('PIX' | 'CARD')[]
  metadata?: Record<string, string>
}

interface AbacateCheckout {
  id: string
  url: string
  amount: number
  status: string
  metadata?: Record<string, string>
}

export async function createCheckout(options: AbacateCheckoutOptions): Promise<AbacateCheckout> {
  return request<AbacateCheckout>('POST', '/checkouts/create', {
    items: options.items,
    returnUrl: options.returnUrl,
    completionUrl: options.completionUrl,
    methods: options.methods ?? ['PIX', 'CARD'],
    ...(options.customerId ? { customerId: options.customerId } : {}),
    ...(options.metadata ? { metadata: options.metadata } : {}),
  })
}

export async function getCheckout(id: string): Promise<AbacateCheckout> {
  return request<AbacateCheckout>('GET', `/checkouts/get?id=${encodeURIComponent(id)}`)
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to `lib/abacatepay.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/abacatepay.ts
git commit -m "feat: add Abacate Pay client library"
```

---

### Task 2: Update environment variables

**Files:**
- Modify: `.env`
- Modify: `.env.local.example`

- [ ] **Step 1: Update `.env`**

Remove the three Stripe env vars and the hyphen from the Abacate Pay key. Add webhook secret placeholder. The file should become:

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB7kKFnClE3A1qwZ0rcZXLtrp5-SaFrk6k
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cowly-b997b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cowly-b997b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cowly-b997b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=916420581401
NEXT_PUBLIC_FIREBASE_APP_ID=1:916420581401:web:a36df2886ed909f484f288

# Abacate Pay
ABACATEPAY_SECRET_KEY=key_kQwGwjDJUe0HxkhTqn5tMCxz
ABACATEPAY_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 2: Update `.env.local.example`**

Replace Stripe placeholders with Abacate Pay placeholders:

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Abacate Pay
ABACATEPAY_SECRET_KEY=
ABACATEPAY_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 3: Commit**

```bash
git add .env .env.local.example
git commit -m "chore: replace Stripe env vars with Abacate Pay"
```

---

### Task 3: Rewrite main checkout route

**Files:**
- Modify: `app/api/checkout/route.ts`

- [ ] **Step 1: Rewrite `app/api/checkout/route.ts`**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createCustomer, getOrCreateProduct, createCheckout } from '@/lib/abacatepay'
import { db } from '@/lib/firebase'
import {
  doc,
  getDoc,
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
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody
    const { items, userId, userEmail } = body

    if (!items?.length || !userId || !userEmail) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // 1. Verifica se é primeira compra
    const userSnap = await getDoc(doc(db, 'users', userId))
    const firstPurchaseDone: boolean = userSnap.exists()
      ? ((userSnap.data().firstPurchaseDone as boolean | undefined) ?? false)
      : false
    const isFirstPurchase = !firstPurchaseDone

    // 2. Busca CPF do usuário para criar customer no Abacate Pay
    const userCpf = userSnap.exists() ? (userSnap.data().cpf as string | undefined) : undefined
    const userName = userSnap.exists() ? (userSnap.data().name as string | undefined) : undefined

    // 3. Cria customer no Abacate Pay
    const customer = await createCustomer(userEmail, userCpf, userName)

    // 4. Aplica desconto de primeira compra no servidor (30%)
    const discountRate = isFirstPurchase ? 0.3 : 0

    // 5. Persiste os pedidos no Firestore ANTES do checkout
    const orderRefs = await Promise.all(
      items.map((item) => {
        const discountedPrice = Math.round(item.finalPrice * (1 - discountRate))
        return addDoc(collection(db, 'orders'), {
          userId,
          productName: item.productName,
          productType: item.productType,
          projectName: item.projectName,
          briefing: item.briefing,
          reference: item.reference,
          prazo: item.prazo,
          price: discountedPrice,
          status: 'pending_payment',
          deliveryUrl: null,
          checkoutId: '',
          createdAt: serverTimestamp(),
        })
      })
    )

    const orderIds = orderRefs.map((r) => r.id).join(',')

    // 6. Cria products on-the-fly no Abacate Pay e monta items do checkout
    const checkoutItems = await Promise.all(
      items.map(async (item) => {
        const discountedPrice = Math.round(item.finalPrice * (1 - discountRate))
        const priceInCents = Math.round(discountedPrice * 100)
        const externalId = `${item.productType}_${priceInCents}`
        const product = await getOrCreateProduct(item.productName, priceInCents, externalId)
        return { id: product.id, quantity: 1 }
      })
    )

    // 7. Cria checkout no Abacate Pay
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const checkout = await createCheckout({
      items: checkoutItems,
      returnUrl: `${appUrl}/dashboard/projetos?success=true`,
      completionUrl: `${appUrl}/api/webhook`,
      customerId: customer.id,
      methods: ['PIX', 'CARD'],
      metadata: { userId, orderIds },
    })

    // 8. Vincula o checkoutId aos pedidos criados
    await Promise.all(
      orderRefs.map((ref) =>
        updateDoc(ref, { checkoutId: checkout.id })
      )
    )

    return NextResponse.json({ url: checkout.url })
  } catch (error) {
    console.error('[checkout]', error)
    return NextResponse.json({ error: 'Erro interno no checkout' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/api/checkout/route.ts
git commit -m "feat: rewrite checkout route to use Abacate Pay"
```

---

### Task 4: Rewrite webhook route

**Files:**
- Modify: `app/api/webhook/route.ts`

- [ ] **Step 1: Rewrite `app/api/webhook/route.ts`**

Replace the entire file with:

```typescript
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
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/api/webhook/route.ts
git commit -m "feat: rewrite webhook route for Abacate Pay"
```

---

### Task 5: Rewrite checkout confirm route

**Files:**
- Modify: `app/api/checkout/confirm/route.ts`

- [ ] **Step 1: Rewrite `app/api/checkout/confirm/route.ts`**

Replace the entire file with:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add app/api/checkout/confirm/route.ts
git commit -m "feat: rewrite checkout confirm for Abacate Pay"
```

---

### Task 6: Rewrite revision payment route

**Files:**
- Modify: `app/api/projetos/[id]/revision/route.ts`

- [ ] **Step 1: Rewrite `app/api/projetos/[id]/revision/route.ts`**

Replace the entire file with:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add app/api/projetos/[id]/revision/route.ts
git commit -m "feat: rewrite revision payment for Abacate Pay"
```

---

### Task 7: Rewrite cart checkout route

**Files:**
- Modify: `app/api/checkout/cart/route.ts`

- [ ] **Step 1: Rewrite `app/api/checkout/cart/route.ts`**

Replace the entire file with:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add app/api/checkout/cart/route.ts
git commit -m "feat: rewrite cart checkout for Abacate Pay"
```

---

### Task 8: Update TypeScript types

**Files:**
- Modify: `types/index.ts` (line 128)

- [ ] **Step 1: Rename `stripeSessionId` to `checkoutId` in types**

In `types/index.ts`, change line 128:

```typescript
// old
stripeSessionId: string
// new
checkoutId: string
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "refactor: rename stripeSessionId to checkoutId in Order type"
```

---

### Task 9: Update frontend references to `stripeSessionId`

**Files:**
- Modify: `app/(admin)/admin/meus-pedidos/page.tsx` (line 45)
- Modify: `app/(customer)/dashboard/projetos/page.tsx` (lines 258, 281, 283, 354)
- Modify: `app/(customer)/dashboard/projetos/[id]/page.tsx` (line 38)

- [ ] **Step 1: Update `app/(admin)/admin/meus-pedidos/page.tsx`**

Change line 45:
```typescript
// old
stripeSessionId:      data.stripeSessionId ?? '',
// new
checkoutId:      data.checkoutId ?? '',
```

- [ ] **Step 2: Update `app/(customer)/dashboard/projetos/page.tsx`**

Change line 258:
```typescript
// old
stripeSessionId: (data.stripeSessionId as string) || '',
// new
checkoutId: (data.checkoutId as string) || '',
```

Change line 281:
```typescript
// old
if (!order.stripeSessionId) return
// new
if (!order.checkoutId) return
```

Change line 283:
```typescript
// old
await confirmSession(order.stripeSessionId)
// new
await confirmSession(order.checkoutId)
```

Change line 354:
```typescript
// old
{order.stripeSessionId && (
// new
{order.checkoutId && (
```

- [ ] **Step 3: Update `app/(customer)/dashboard/projetos/[id]/page.tsx`**

Change line 38:
```typescript
// old
stripeSessionId: data.stripeSessionId ?? '',
// new
checkoutId: data.checkoutId ?? '',
```

- [ ] **Step 4: Commit**

```bash
git add app/(admin)/admin/meus-pedidos/page.tsx app/(customer)/dashboard/projetos/page.tsx "app/(customer)/dashboard/projetos/[id]/page.tsx"
git commit -m "refactor: rename stripeSessionId to checkoutId in frontend"
```

---

### Task 10: Update frontend branding text

**Files:**
- Modify: `app/page.tsx` (line 62)
- Modify: `app/(public)/products/[slug]/page.tsx` (line 175)
- Modify: `app/(customer)/dashboard/carrinho/page.tsx` (lines 107, 357)

- [ ] **Step 1: Update `app/page.tsx`**

Change line 62:
```typescript
// old
{ n: '02', title: 'Finalize o pagamento', desc: 'Checkout seguro via Stripe. Primeira compra com 30% de desconto automático. Quer prioridade? Adicione o pacote express.' },
// new
{ n: '02', title: 'Finalize o pagamento', desc: 'Checkout seguro via Abacate Pay. Primeira compra com 30% de desconto automático. Quer prioridade? Adicione o pacote express.' },
```

- [ ] **Step 2: Update `app/(public)/products/[slug]/page.tsx`**

Change line 175:
```typescript
// old
Checkout seguro via Stripe. Confirmação imediata.
// new
Checkout seguro via Abacate Pay. Confirmação imediata.
```

- [ ] **Step 3: Update `app/(customer)/dashboard/carrinho/page.tsx`**

Change line 107 comment:
```typescript
// old
// Persiste dados do comprador antes de ir ao Stripe (sem máscara)
// new
// Persiste dados do comprador antes de ir ao Abacate Pay (sem máscara)
```

Change line 357:
```typescript
// old
              Pagamento seguro via Stripe
// new
              Pagamento seguro via Abacate Pay
```

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx "app/(public)/products/[slug]/page.tsx" "app/(customer)/dashboard/carrinho/page.tsx"
git commit -m "chore: update branding text from Stripe to Abacate Pay"
```

---

### Task 11: Remove Stripe dependency

**Files:**
- Delete: `lib/stripe.ts`
- Modify: `package.json`

- [ ] **Step 1: Delete `lib/stripe.ts`**

```bash
rm lib/stripe.ts
```

- [ ] **Step 2: Uninstall stripe package**

```bash
npm uninstall stripe
```

- [ ] **Step 3: Verify full build compiles**

Run: `npx tsc --noEmit`
Expected: No errors. No remaining references to `stripe` or `@/lib/stripe`.

- [ ] **Step 4: Verify no remaining Stripe imports**

Search for any leftover `stripe` imports:
```bash
grep -r "from.*stripe\|import.*stripe\|require.*stripe" --include="*.ts" --include="*.tsx" .
```
Expected: No results.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Stripe dependency and lib/stripe.ts"
```

---

### Task 12: Final verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 2: Run dev server and verify pages load**

```bash
npm run dev
```

Visit:
- `http://localhost:3000` — landing page loads, step 02 says "Abacate Pay"
- `http://localhost:3000/dashboard/carrinho` — cart page loads, footer says "Abacate Pay"

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: final adjustments for Abacate Pay migration"
```
