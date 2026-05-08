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
    price,
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
  id: string
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
