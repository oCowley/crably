# DominioStage Redesign — Design Spec

## Overview

Replace the current domain stage (which collected hosting credentials) with a DNS-guided flow that instructs the client to add two DNS records in their registrar, then submits only the domain name to Firestore.

---

## Customer UI — DominioStage

### Block 1: Domain input
- Label: "Qual é o seu domínio?"
- Text input, placeholder: `meusite.com.br`
- Required before submit

### Block 2: DNS records table
Two copyable record cards displayed as a clean table:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | `@` | `76.76.21.21` | Auto |
| CNAME | `www` | `cname.vercel-dns.com` | Auto |

Each row has a copy button for the **Value** field. Copy button shows a brief "Copiado!" confirmation.

### Block 3: Generic tutorial (collapsible)
Toggle: "Como fazer isso?" — expands to show 4 steps:
1. Acesse o painel da sua registradora (onde você comprou o domínio)
2. Procure por "DNS", "Zona DNS" ou "Gerenciar DNS"
3. Adicione os dois registros acima exatamente como mostrado
4. Salve — a propagação pode levar até 48h

### Confirmation + Submit
- Checkbox: "Já adicionei os registros DNS"
- Button: "Confirmar domínio" — disabled until domain input is filled AND checkbox is checked
- On submit: POST to `/api/projetos/[id]/domain` with `{ domainName }`

### Confirmed state
When `order.projectStage === 'aguardando_dominio'` (or after successful submit):
- Show green success banner: "Domínio recebido! Nossa equipe vai conectar `[domainName]` ao seu site em breve."

---

## API Route — `/api/projetos/[id]/domain`

Replace existing body interface `{ host, user, pass, notes }` with `{ domainName: string }`.

Firestore update:
```ts
await updateDoc(doc(db, 'orders', id), {
  domainName,
  projectStage: 'aguardando_dominio',
  updatedAt: serverTimestamp(),
})
```

Remove writes of `domainHost`, `domainUser`, `domainPass`, `domainNotes`.

---

## Types — DashboardOrder

Add `domainName?: string` field.
Remove `domainHost`, `domainUser`, `domainPass`, `domainNotes` fields.

---

## DevOrderCard (admin dev panel)

Replace the domain credentials section with a simple display:

```
Domínio do cliente
meusite.com.br
```

Remove `domainHost`, `domainUser`, `domainPass`, `domainNotes` display blocks and the security warning. Show `domainName` when `showDomain` condition is met.

---

## Confirmed State Logic

`DominioStage` shows the confirmed state when:
- `order.projectStage === 'aguardando_dominio'` OR `order.projectStage === 'entregue'`

Confirmed banner includes `order.domainName` if available.
