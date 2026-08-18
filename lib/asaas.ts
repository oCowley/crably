const BASE_URL = 'https://api.asaas.com/v3'

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY
  if (!key) throw new Error('ASAAS_API_KEY is not set')
  return key
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      access_token: getApiKey(),
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const text = await res.text()
  let json: Record<string, unknown>

  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Asaas: resposta inválida (${res.status}): ${text.slice(0, 200)}`)
  }

  if (!res.ok) {
    const errors = Array.isArray(json.errors)
      ? (json.errors as { description?: string }[])
          .map((e) => e.description)
          .filter(Boolean)
          .join('; ')
      : undefined
    throw new Error(`Asaas [${res.status}] ${method} ${path}: ${errors || text.slice(0, 200)}`)
  }

  return json as T
}

/**
 * O Asaas exige URLs de callback públicas em https — rejeita http://localhost.
 * Em dev, os redirects pós-pagamento caem no site publicado; para confirmar
 * um pagamento em localhost use o botão "verificar pagamento" em /dashboard/projetos.
 */
export function getCallbackBaseUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  if (appUrl.startsWith('https://')) return appUrl
  return 'https://crably.com.br'
}

// --- Checkouts ---

export interface AsaasCheckoutItem {
  name: string // máx. 30 chars (truncado abaixo)
  description?: string // máx. 150 chars
  quantity: number
  value: number // em REAIS (não centavos)
  externalReference?: string
}

interface AsaasCustomerData {
  name?: string
  cpfCnpj?: string
  email?: string
  phone?: string
}

interface AsaasCheckoutOptions {
  items: AsaasCheckoutItem[]
  successUrl: string
  cancelUrl: string
  expiredUrl?: string
  externalReference?: string // máx. 200 chars
  customerData?: AsaasCustomerData
  billingTypes?: ('PIX' | 'CREDIT_CARD')[]
}

export interface AsaasCheckout {
  id: string
  link: string
  status: 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAID'
  externalReference?: string | null
}

export async function createCheckout(options: AsaasCheckoutOptions): Promise<AsaasCheckout> {
  const payload = {
    billingTypes: options.billingTypes ?? ['PIX', 'CREDIT_CARD'],
    chargeTypes: ['DETACHED'],
    minutesToExpire: 60,
    items: options.items.map((item) => ({
      ...item,
      name: item.name.slice(0, 30),
      ...(item.description ? { description: item.description.slice(0, 150) } : {}),
    })),
    callback: {
      successUrl: options.successUrl,
      cancelUrl: options.cancelUrl,
      ...(options.expiredUrl ? { expiredUrl: options.expiredUrl } : {}),
    },
    ...(options.externalReference ? { externalReference: options.externalReference } : {}),
    ...(options.customerData ? { customerData: options.customerData } : {}),
  }

  try {
    return await request<AsaasCheckout>('POST', '/checkouts', payload)
  } catch (err) {
    // Conta sem chave Pix cadastrada não pode gerar cobrança PIX.
    // Cai para cartão até a chave ser criada no painel do Asaas.
    const msg = err instanceof Error ? err.message : ''
    const wantsPix = (payload.billingTypes as string[]).includes('PIX')
    if (wantsPix && msg.includes('chave Pix')) {
      console.warn('[asaas] Conta sem chave Pix — checkout criado só com cartão. Cadastre uma chave Pix no painel do Asaas.')
      return request<AsaasCheckout>('POST', '/checkouts', {
        ...payload,
        billingTypes: ['CREDIT_CARD'],
      })
    }
    throw err
  }
}

// --- Payments ---

export interface AsaasPayment {
  id: string
  status: string
  value: number
  checkoutSession: string | null
}

const PAID_STATUSES = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']

/** Verifica se a sessão de checkout gerou algum pagamento confirmado/recebido. */
export async function isCheckoutPaid(checkoutId: string): Promise<boolean> {
  const res = await request<{ data: AsaasPayment[] }>(
    'GET',
    `/payments?checkoutSession=${encodeURIComponent(checkoutId)}&limit=100`
  )
  // Refiltra localmente: se a API ignorar o parâmetro, não podemos confirmar por engano
  return res.data.some(
    (p) => p.checkoutSession === checkoutId && PAID_STATUSES.includes(p.status)
  )
}
