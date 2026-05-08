# Migração Stripe → Abacate Pay

## Objetivo

Substituir completamente o Stripe pelo Abacate Pay como gateway de pagamento, mantendo o mesmo fluxo redirect-based de checkout.

## Decisões

- Substituição 100% do Stripe (sem fallback)
- Checkout hospedado (redirect para página do Abacate Pay)
- PIX + Cartão de Crédito habilitados
- Products criados on-the-fly no momento do checkout
- Cupons/descontos processados no nosso lado (sem usar cupons nativos do Abacate Pay)
- Pagamento de revisão mantido (R$297)

## API do Abacate Pay

- **Base URL:** `https://api.abacatepay.com/v2`
- **Auth:** `Authorization: Bearer <ABACATEPAY_SECRET_KEY>`
- **Resposta padrão:** `{ data, success, error }`
- **Valores:** sempre em centavos (BRL)

### Endpoints utilizados

| Endpoint | Uso |
|----------|-----|
| `POST /customers/create` | Criar customer com email + CPF |
| `POST /products/create` | Criar product on-the-fly (externalId = Firestore product ID) |
| `GET /products/list?externalId=X` | Verificar se product já existe |
| `POST /checkouts/create` | Criar sessão de checkout |
| `GET /checkouts/get?id=X` | Verificar status do pagamento |

### Webhook

- **Evento:** `checkout.completed`
- **Validação camada 1:** `webhookSecret` no query string
- **Validação camada 2:** `X-Webhook-Signature` header (HMAC-SHA256)
- **Payload:** `{ id, event, apiVersion, devMode, data }`

## Arquitetura

### Client API — `lib/abacatepay.ts`

Wrapper com `fetch` sobre a API REST. Funções:

- `createCustomer(email, taxId?, name?)` → POST /customers/create
- `createProduct(name, price, externalId)` → POST /products/create
- `getProductByExternalId(externalId)` → GET /products/list?externalId=X
- `getOrCreateProduct(name, price, externalId)` → verifica existência, cria se necessário
- `createCheckout(items, options)` → POST /checkouts/create
- `getCheckout(id)` → GET /checkouts/get?id=X

### Fluxo de Checkout (principal)

```
Cliente clica "Finalizar pedido"
  → POST /api/checkout
    → Cria customer no Abacate Pay (email + CPF)
    → Para cada item do carrinho:
      → getOrCreateProduct(name, finalPrice, firestoreProductId)
    → Cria orders no Firestore (status: pending_payment)
    → POST /checkouts/create com items + metadata(orderIds)
    → Retorna { url: checkout.url }
  → Redirect para Abacate Pay
  → Pagamento completado
  → Webhook checkout.completed
    → Atualiza orders: pending_payment → aguardando
    → projectStage: briefing
    → firstPurchaseDone: true
```

### Fluxo de Confirmação

```
Cliente volta para /dashboard/projetos?success=true&session_id=X
  → POST /api/checkout/confirm { sessionId }
    → GET /checkouts/get?id=sessionId
    → Se status === 'PAID': atualiza orders
```

### Fluxo de Revisão

```
Cliente em stage em_revisao clica "Solicitar revisão"
  → POST /api/projetos/[id]/revision
    → getOrCreateProduct("Revisão de Projeto", 29700, "revision")
    → POST /checkouts/create com metadata { orderId, type: revision }
    → Retorna { url }
  → Redirect para Abacate Pay
  → Webhook trata type: revision
    → projectStage: em_revisao, revisionPaid: true
```

### Sistema de Cupons

- Cupons validados localmente no `ConfigurarPedidoModal`
- `finalPrice` já chega com desconto aplicado no `CartItem`
- Product criado no Abacate Pay usa `finalPrice` (preço final com desconto)
- Desconto primeira compra: servidor verifica `firstPurchaseDone`, aplica 30%

## Variáveis de Ambiente

### Remover
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Manter/Adicionar
- `ABACATEPAY_SECRET_KEY` (renomear de `ABACATEPAY-SECRET_KEY`)
- `ABACATEPAY_WEBHOOK_SECRET` (configurar no dashboard)

## Arquivos

### Criar
- `lib/abacatepay.ts`

### Modificar
- `app/api/checkout/route.ts`
- `app/api/checkout/confirm/route.ts`
- `app/api/checkout/cart/route.ts` (ou remover se redundante)
- `app/api/webhook/route.ts`
- `app/api/projetos/[id]/revision/route.ts`
- `.env`
- Frontend: textos de branding (3 arquivos)

### Remover
- `lib/stripe.ts`
- Pacote `stripe` do `package.json`

### Sem mudanças
- `contexts/CartContext.tsx`
- `types/index.ts`
- `components/dashboard/ConfigurarPedidoModal.tsx`
- Estrutura de orders no Firestore
- Fluxo do usuário
