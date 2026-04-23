# Meus Pedidos (Dev/Admin) — Design Spec

## Overview

A "Meus Pedidos" page for users with role `developer` or `admin`, showing only orders assigned to the logged-in user. Allows developers to manage development progress, update stages, set deploy URL, and view all client-provided context.

---

## Route & Access

- **Path:** `app/(admin)/admin/meus-pedidos/page.tsx`
- **Auth guard:** Same as other admin pages (`requireAdminOrDev` — role must be `developer` or `admin`)
- **Filter:** `assignedDevId === currentUser.uid` queried from the `orders` Firestore collection
- **Sidebar:** New "Meus Pedidos" link with `Briefcase` icon added to `components/admin/Sidebar.tsx`, visible for both `developer` and `admin` roles

---

## Data Model

No schema changes needed. Uses existing `orders` collection fields:

| Field | Used for |
|---|---|
| `assignedDevId` | Filter — only show orders matching current user |
| `projectStage` | Stage badge + advance button logic |
| `devProgress` | 4-step stepper (0 = none done, 4 = all done) |
| `deployUrl` | Editable inline field |
| `briefing` | Client briefing text (read-only) |
| `briefingNotes` | Client extra notes (read-only) |
| `references` | Client reference URLs (read-only) |
| `productName` | Card title context |
| `projectName` | Card title |
| `prazo` | Shows deadline label (7 or 14 business days) |
| `developmentStartedAt` | Used to calculate deadline |
| `domainHost/domainUser/domainPass/domainNotes` | Shown when stage is `aguardando_dominio` or `entregue` |

---

## UI — Page Layout

```
┌─────────────────────────────────────────┐
│ Meus Pedidos                            │
│ X pedidos atribuídos a você             │
├─────────────────────────────────────────┤
│ [Card] Project A     [badge: em_dev]    │
│   Stepper: ●●○○  Deploy: [url] [Salvar] │
│   [Briefing expandable]                 │
│   [Avançar etapa →]                     │
├─────────────────────────────────────────┤
│ [Card] Project B     [badge: entregue]  │
│   ...                                   │
└─────────────────────────────────────────┘
```

Empty state: "Nenhum pedido atribuído a você ainda."

---

## Components

### `app/(admin)/admin/meus-pedidos/page.tsx`
- Client component
- Fetches current user from Firebase Auth
- Queries Firestore: `collection(db, 'orders')` where `assignedDevId == uid`
- Orders sorted by `createdAt` desc
- Maps each order to `<DevOrderCard />`

### `app/(admin)/admin/meus-pedidos/DevOrderCard.tsx`
Single-file component containing all card UI and actions. Sections:

**Header:**
- Project name + product type
- Stage badge (colored by stage)
- Deadline badge (X business days remaining, calculated from `developmentStartedAt` + prazo)

**Dev Progress Stepper:**
- 4 steps: `Design`, `Frontend`, `Conteúdo`, `QA`
- Each step is a clickable button — clicking advances `devProgress` to that step's index + 1
- Steps already done show filled/colored; future steps show muted
- Updates `devProgress` in Firestore on click

**Deploy URL:**
- Inline text input + "Salvar" button
- Saves `deployUrl` to Firestore

**Briefing Section (collapsible):**
- Client briefing text
- Extra notes (`briefingNotes`) if present
- Reference links (`references[]`) if present

**Domain Credentials (conditional):**
- Only shown when `projectStage === 'aguardando_dominio'` or `'entregue'`
- Displays `domainHost`, `domainUser`, `domainPass`, `domainNotes` read-only
- Warning: "Credenciais sensíveis — não compartilhe"

**Advance Stage Button:**
- Only shown when stage is one of: `em_desenvolvimento`, `em_revisao`, `aguardando_dominio`
- Label and target stage:
  - `em_desenvolvimento` → button "Enviar para revisão" → sets `projectStage: 'em_revisao'`
  - `em_revisao` → button "Aguardando domínio" → sets `projectStage: 'aguardando_dominio'`
  - `aguardando_dominio` → button "Marcar como entregue" → sets `projectStage: 'entregue'`
- Updates `projectStage` (and sets `deliveryUrl` if applicable) in Firestore on click

---

## API

No new API routes needed. All Firestore writes are done directly from the client component (same pattern as `agendamentos/page.tsx`):

- `updateDoc(doc(db, 'orders', id), { devProgress })` — progress step
- `updateDoc(doc(db, 'orders', id), { deployUrl })` — deploy URL
- `updateDoc(doc(db, 'orders', id), { projectStage })` — stage advance

---

## Sidebar Change

`components/admin/Sidebar.tsx` — add entry:
```tsx
{ href: '/admin/meus-pedidos', label: 'Meus Pedidos', icon: Briefcase }
```
Visible when `role === 'developer' || role === 'admin'`.

---

## Error & Edge Cases

- No assigned orders → empty state message
- `developmentStartedAt` null → deadline badge hidden
- `devProgress` undefined → treat as 0 (no steps done)
- Stage already `entregue` → no advance button shown
- Domain fields only shown when stage is `aguardando_dominio` or `entregue`
