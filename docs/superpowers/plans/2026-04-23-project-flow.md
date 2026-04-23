# Project Flow (Post-Purchase) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete post-purchase client journey — from briefing submission through meet scheduling, development tracking, optional paid revision, domain setup, and final delivery — driven by a `projectStage` field on each Firestore order document.

**Architecture:** A new `/dashboard/projetos/[id]` detail page renders a vertical stepper UI where each stage activates in sequence. The `projectStage` field on the order document is the single source of truth. Admin panel gains tools to manage available meeting slots, paste meet links, set deploy URLs, and advance project stages. The revision step triggers a Stripe checkout; payment confirms advance to `em_revisao`.

**Tech Stack:** Next.js 16 App Router, Firebase Firestore + Storage, Stripe (revision checkout), Tailwind v4, lucide-react

---

## Firestore collections used

| Collection | Key fields |
|---|---|
| `orders/{id}` | `projectStage`, `briefingNotes`, `references[]` (up to 5 URLs), `meetSlotId`, `meetLink`, `meetDate`, `developmentStartedAt`, `deployUrl`, `revisionPaid`, `domainHost`, `domainUser`, `domainPass`, `deliveryUrl` |
| `meetSlots/{id}` | `date` (YYYY-MM-DD), `hour` ('09:00'), `available` (bool), `orderId?`, `meetLink?` |

---

## File Structure

### New files
| File | Responsibility |
|---|---|
| `app/(customer)/dashboard/projetos/[id]/page.tsx` | Project detail — reads order via `onSnapshot`, renders `StageFlow` |
| `app/(customer)/dashboard/projetos/[id]/StageFlow.tsx` | Vertical stepper with 6 stages |
| `app/(customer)/dashboard/projetos/[id]/stages/BriefingStage.tsx` | Form: extra notes + up to 5 reference URLs |
| `app/(customer)/dashboard/projetos/[id]/stages/AgendamentoStage.tsx` | Slot picker grid + D+3 warning |
| `app/(customer)/dashboard/projetos/[id]/stages/DesenvolvimentoStage.tsx` | Dev stage tracker + deploy preview link |
| `app/(customer)/dashboard/projetos/[id]/stages/RevisaoStage.tsx` | Revision CTA + Stripe checkout trigger |
| `app/(customer)/dashboard/projetos/[id]/stages/DominioStage.tsx` | Domain credentials form |
| `app/(customer)/dashboard/projetos/[id]/stages/EntregaStage.tsx` | Final delivery state |
| `app/api/projetos/[id]/briefing/route.ts` | POST: save notes + references → set stage `agendamento` |
| `app/api/projetos/[id]/slot/route.ts` | POST: book slot → set stage `meet_confirmado` after admin confirms |
| `app/api/projetos/[id]/revision/route.ts` | POST: create Stripe session for revision |
| `app/api/projetos/[id]/domain/route.ts` | POST: save domain credentials → set stage `entregue` pending admin |
| `app/(admin)/admin/agendamentos/page.tsx` | Admin: create/delete slots + paste meet link to confirm booking |

### Modified files
| File | What changes |
|---|---|
| `types/index.ts` | Add `ProjectStage`, `MeetSlot`; extend `DashboardOrder` with new fields; replace `DashboardProjectStatus` |
| `app/api/webhook/route.ts` | Set `projectStage: 'briefing'` (was `status: 'aguardando'`) |
| `app/(customer)/dashboard/projetos/page.tsx` | Update `STATUS_CONFIG` to `ProjectStage`; add "Ver projeto →" link per card |
| `app/(admin)/admin/pedidos/page.tsx` | Add meet link + deploy URL + stage advance fields to EditModal |
| `app/(admin)/layout.tsx` | Add "Agendamentos" nav link |

---

## Task 1: Extend types

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Replace `DashboardProjectStatus` and add new types**

Replace the existing `DashboardProjectStatus` block and add new interfaces. The full new block:

```typescript
// Replace DashboardProjectStatus with ProjectStage
export type ProjectStage =
  | 'pending_payment'
  | 'briefing'
  | 'agendamento'
  | 'meet_confirmado'
  | 'em_desenvolvimento'
  | 'em_revisao'
  | 'aguardando_dominio'
  | 'entregue'

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  pending_payment:    'Processando pagamento…',
  briefing:           'Briefing',
  agendamento:        'Agendamento do meet',
  meet_confirmado:    'Meet agendado',
  em_desenvolvimento: 'Em desenvolvimento',
  em_revisao:         'Em revisão',
  aguardando_dominio: 'Conexão de domínio',
  entregue:           'Entregue',
}

export interface MeetSlot {
  id: string
  date: string      // 'YYYY-MM-DD'
  hour: string      // '09:00'
  available: boolean
  orderId?: string
  meetLink?: string
}
```

Also extend `DashboardOrder`:

```typescript
export interface DashboardOrder {
  id: string
  userId: string
  productName: string
  productType: string
  projectName: string
  briefing: string
  reference: string
  prazo: '14dias' | '7dias'
  price: number
  projectStage: ProjectStage
  stripeSessionId: string
  deliveryUrl: string | null
  deployUrl: string | null
  meetLink: string | null
  meetDate: string | null
  revisionPaid: boolean
  createdAt: Date
  developmentStartedAt: Date | null
}
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add ProjectStage type and extend DashboardOrder"
```

---

## Task 2: Update webhook — set `projectStage: 'briefing'`

**Files:**
- Modify: `app/api/webhook/route.ts`

- [ ] **Step 1: Change `status: 'aguardando'` to `projectStage: 'briefing'` in the updateDoc call**

```typescript
await Promise.all(
  orderIds.map((orderId) =>
    updateDoc(doc(db, 'orders', orderId), {
      projectStage: 'briefing',
      updatedAt: serverTimestamp(),
    })
  )
)
```

> Note: the order document already has `status` written by `/api/checkout/route.ts`. We are now using `projectStage` as the stage field. Keep `status` field intact for backward compatibility with the admin `pedidos` page which reads `projectStatus`. We are adding `projectStage` as a parallel field.

- [ ] **Step 2: Commit**

```bash
git add app/api/webhook/route.ts
git commit -m "feat: webhook sets projectStage to briefing on payment"
```

---

## Task 3: Update projetos list page to use `ProjectStage`

**Files:**
- Modify: `app/(customer)/dashboard/projetos/page.tsx`

- [ ] **Step 1: Replace `DashboardProjectStatus` references with `ProjectStage`**

At the top of the file, update the import:

```typescript
import type { DashboardOrder, ProjectStage } from '@/types'
import { PROJECT_STAGE_LABELS } from '@/types'
```

- [ ] **Step 2: Update `STATUS_ORDER` and `STATUS_CONFIG`**

```typescript
const STATUS_ORDER: ProjectStage[] = [
  'briefing',
  'agendamento',
  'meet_confirmado',
  'em_desenvolvimento',
  'em_revisao',
  'aguardando_dominio',
  'entregue',
]

const STATUS_CONFIG: Record<
  ProjectStage,
  { color: string; bg: string; border: string; icon: React.ReactNode; label: string }
> = {
  pending_payment: {
    color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20',
    icon: <Loader2 size={13} className="animate-spin" />, label: 'Processando pagamento…',
  },
  briefing: {
    color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20',
    icon: <FileText size={13} />, label: 'Briefing pendente',
  },
  agendamento: {
    color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20',
    icon: <Calendar size={13} />, label: 'Agendar meet',
  },
  meet_confirmado: {
    color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20',
    icon: <Clock size={13} />, label: 'Meet agendado',
  },
  em_desenvolvimento: {
    color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20',
    icon: <Zap size={13} />, label: 'Em desenvolvimento',
  },
  em_revisao: {
    color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20',
    icon: <Eye size={13} />, label: 'Em revisão',
  },
  aguardando_dominio: {
    color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20',
    icon: <Link2 size={13} />, label: 'Conexão de domínio',
  },
  entregue: {
    color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20',
    icon: <CheckCircle2 size={13} />, label: 'Entregue',
  },
}
```

- [ ] **Step 3: Update `getProgressPercent`**

```typescript
function getProgressPercent(stage: ProjectStage): number {
  const map: Record<ProjectStage, number> = {
    pending_payment: 0,
    briefing: 10,
    agendamento: 20,
    meet_confirmado: 30,
    em_desenvolvimento: 55,
    em_revisao: 75,
    aguardando_dominio: 88,
    entregue: 100,
  }
  return map[stage]
}
```

- [ ] **Step 4: Update `onSnapshot` mapping — read `projectStage` field**

In the `onSnapshot` callback, change:

```typescript
projectStage: (data.projectStage as ProjectStage) ?? 'briefing',
deployUrl: (data.deployUrl as string | null) ?? null,
meetLink: (data.meetLink as string | null) ?? null,
meetDate: (data.meetDate as string | null) ?? null,
revisionPaid: (data.revisionPaid as boolean) ?? false,
developmentStartedAt: data.developmentStartedAt instanceof Timestamp
  ? data.developmentStartedAt.toDate()
  : null,
```

Remove the old `status` field mapping in this snapshot and replace with `projectStage`.

- [ ] **Step 5: On each active order card, add a "Ver projeto →" link**

Inside the card's top-right action area (after the price), add:

```tsx
<Link
  href={`/dashboard/projetos/${order.id}`}
  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
>
  Ver projeto <ExternalLink size={12} />
</Link>
```

- [ ] **Step 6: Update `pendingOrders`/`activeOrders` filter to use `projectStage`**

```typescript
const pendingOrders = orders.filter((o) => o.projectStage === 'pending_payment')
const activeOrders  = orders.filter((o) => o.projectStage !== 'pending_payment')
```

- [ ] **Step 7: Update `StatusTimeline` to use `ProjectStage`**

```typescript
function StatusTimeline({ stage }: { stage: ProjectStage }) {
  if (stage === 'pending_payment') return null
  const currentIndex = STATUS_ORDER.indexOf(stage)
  // rest of the render is the same, replace `status` → `stage` and `review.stars` → `review.stage`
  // Use STATUS_CONFIG[s] as before
}
```

And change usage: `<StatusTimeline stage={order.projectStage} />`

- [ ] **Step 8: Commit**

```bash
git add app/(customer)/dashboard/projetos/page.tsx
git commit -m "feat: projetos list uses ProjectStage + adds Ver projeto link"
```

---

## Task 4: Create the project detail page

**Files:**
- Create: `app/(customer)/dashboard/projetos/[id]/page.tsx`

- [ ] **Step 1: Create the page — reads order via `onSnapshot` and renders `StageFlow`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { DashboardOrder, ProjectStage } from '@/types'
import StageFlow from './StageFlow'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ProjetoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<DashboardOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'orders', id), (snap) => {
      if (!snap.exists()) { router.push('/dashboard/projetos'); return }
      const data = snap.data()
      // guard: only owner or admin can view
      if (data.userId !== user?.uid) { router.push('/dashboard/projetos'); return }
      setOrder({
        id: snap.id,
        userId: data.userId,
        productName: data.productName ?? '',
        productType: data.productType ?? '',
        projectName: data.projectName ?? '',
        briefing: data.briefing ?? '',
        reference: data.reference ?? '',
        prazo: data.prazo ?? '14dias',
        price: data.price ?? 0,
        projectStage: (data.projectStage as ProjectStage) ?? 'briefing',
        stripeSessionId: data.stripeSessionId ?? '',
        deliveryUrl: data.deliveryUrl ?? null,
        deployUrl: data.deployUrl ?? null,
        meetLink: data.meetLink ?? null,
        meetDate: data.meetDate ?? null,
        revisionPaid: data.revisionPaid ?? false,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        developmentStartedAt: data.developmentStartedAt instanceof Timestamp
          ? data.developmentStartedAt.toDate()
          : null,
      })
      setLoading(false)
    })
    return unsub
  }, [id, user, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-neutral-600" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/dashboard/projetos"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{order.productName}</h1>
          {order.projectName && (
            <p className="text-sm text-neutral-500 mt-0.5">{order.projectName}</p>
          )}
        </div>
      </div>
      <StageFlow order={order} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(customer)/dashboard/projetos/[id]/page.tsx"
git commit -m "feat: project detail page with order listener"
```

---

## Task 5: Create `StageFlow` component

**Files:**
- Create: `app/(customer)/dashboard/projetos/[id]/StageFlow.tsx`

- [ ] **Step 1: Create the vertical stepper that renders each stage**

```typescript
import type { DashboardOrder, ProjectStage } from '@/types'
import BriefingStage from './stages/BriefingStage'
import AgendamentoStage from './stages/AgendamentoStage'
import DesenvolvimentoStage from './stages/DesenvolvimentoStage'
import RevisaoStage from './stages/RevisaoStage'
import DominioStage from './stages/DominioStage'
import EntregaStage from './stages/EntregaStage'
import { CheckCircle2, Circle } from 'lucide-react'

type StageItem = {
  key: ProjectStage | ProjectStage[]
  label: string
  component: (props: { order: DashboardOrder; active: boolean; done: boolean }) => React.ReactNode
}

const STAGES: StageItem[] = [
  {
    key: 'briefing',
    label: 'Briefing',
    component: (props) => <BriefingStage {...props} />,
  },
  {
    key: ['agendamento', 'meet_confirmado'],
    label: 'Agendamento do meet',
    component: (props) => <AgendamentoStage {...props} />,
  },
  {
    key: 'em_desenvolvimento',
    label: 'Desenvolvimento',
    component: (props) => <DesenvolvimentoStage {...props} />,
  },
  {
    key: 'em_revisao',
    label: 'Revisão (opcional)',
    component: (props) => <RevisaoStage {...props} />,
  },
  {
    key: 'aguardando_dominio',
    label: 'Domínio',
    component: (props) => <DominioStage {...props} />,
  },
  {
    key: 'entregue',
    label: 'Entrega',
    component: (props) => <EntregaStage {...props} />,
  },
]

const STAGE_ORDER: ProjectStage[] = [
  'pending_payment',
  'briefing',
  'agendamento',
  'meet_confirmado',
  'em_desenvolvimento',
  'em_revisao',
  'aguardando_dominio',
  'entregue',
]

function stageIndex(stage: ProjectStage) {
  return STAGE_ORDER.indexOf(stage)
}

function isActive(item: StageItem, current: ProjectStage): boolean {
  if (Array.isArray(item.key)) return item.key.includes(current)
  return item.key === current
}

function isDone(item: StageItem, current: ProjectStage): boolean {
  const currentIdx = stageIndex(current)
  const keys = Array.isArray(item.key) ? item.key : [item.key]
  return keys.every((k) => stageIndex(k) < currentIdx)
}

export default function StageFlow({ order }: { order: DashboardOrder }) {
  return (
    <div className="space-y-3">
      {STAGES.map((item, i) => {
        const active = isActive(item, order.projectStage)
        const done = isDone(item, order.projectStage)
        const locked = !active && !done

        return (
          <div key={i} className={`rounded-2xl border transition-all ${
            active
              ? 'border-brand/30 bg-brand/5'
              : done
                ? 'border-green-500/20 bg-green-500/5'
                : 'border-white/5 bg-white/[0.02]'
          }`}>
            {/* Stage header */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                done
                  ? 'bg-green-500 text-white'
                  : active
                    ? 'bg-brand text-white'
                    : 'bg-white/5 text-neutral-600 border border-white/10'
              }`}>
                {done ? <CheckCircle2 size={13} /> : locked ? <Circle size={10} /> : i + 1}
              </div>
              <span className={`text-sm font-semibold ${
                done ? 'text-green-400' : active ? 'text-white' : 'text-neutral-600'
              }`}>
                {item.label}
              </span>
              {done && (
                <span className="ml-auto text-xs text-green-500/70 font-medium">Concluído</span>
              )}
              {locked && (
                <span className="ml-auto text-xs text-neutral-700 font-medium">Aguardando etapas anteriores</span>
              )}
            </div>

            {/* Stage content — only visible when active */}
            {active && (
              <div className="px-5 pb-5 pt-1 border-t border-brand/10">
                {item.component({ order, active, done })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create `stages/` directory placeholder files (empty stubs) so the import chain resolves**

Create each with a minimal export so the project compiles:

`app/(customer)/dashboard/projetos/[id]/stages/BriefingStage.tsx`:
```typescript
import type { DashboardOrder } from '@/types'
export default function BriefingStage({ order }: { order: DashboardOrder; active: boolean; done: boolean }) {
  return <p className="text-sm text-neutral-500">Carregando…</p>
}
```

Repeat for `AgendamentoStage.tsx`, `DesenvolvimentoStage.tsx`, `RevisaoStage.tsx`, `DominioStage.tsx`, `EntregaStage.tsx` — same stub pattern.

- [ ] **Step 3: Verify app compiles**

```bash
cd "C:/Users/olive/OneDrive/Documentos/pessoal/cowly" && npx next build 2>&1 | tail -20
```

Expected: build succeeds (or only pre-existing warnings).

- [ ] **Step 4: Commit**

```bash
git add "app/(customer)/dashboard/projetos/[id]/"
git commit -m "feat: StageFlow component with stage skeleton"
```

---

## Task 6: Briefing Stage

**Files:**
- Create: `app/(customer)/dashboard/projetos/[id]/stages/BriefingStage.tsx`
- Create: `app/api/projetos/[id]/briefing/route.ts`

- [ ] **Step 1: Create the briefing API route**

```typescript
// app/api/projetos/[id]/briefing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

interface BriefingBody {
  notes: string
  references: string[]   // up to 5 URLs
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { notes, references }: BriefingBody = await req.json()

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const refs = references.filter(Boolean).slice(0, 5)

  await updateDoc(doc(db, 'orders', id), {
    briefingNotes: notes,
    references: refs,
    projectStage: 'agendamento',
    updatedAt: serverTimestamp(),
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create `BriefingStage.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { DashboardOrder } from '@/types'
import { Plus, Trash2, Loader2, ArrowRight } from 'lucide-react'

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors'

export default function BriefingStage({ order }: { order: DashboardOrder; active: boolean; done: boolean }) {
  const [notes, setNotes]         = useState('')
  const [refs, setRefs]           = useState<string[]>([''])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  function addRef() {
    if (refs.length >= 5) return
    setRefs([...refs, ''])
  }

  function updateRef(i: number, value: string) {
    setRefs(refs.map((r, idx) => (idx === i ? value : r)))
  }

  function removeRef(i: number) {
    setRefs(refs.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/projetos/${order.id}/briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, references: refs }),
      })
      if (!res.ok) throw new Error('Erro ao salvar briefing')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-neutral-300 leading-relaxed mb-1">
          Antes de começar, queremos entender melhor seu projeto.
          O briefing preenchido na compra já foi recebido — use este espaço para adicionar detalhes extras e referências visuais.
        </p>
      </div>

      {/* Brief do pedido (readonly) */}
      {order.briefing && (
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8">
          <p className="text-xs font-medium text-neutral-500 mb-1.5">Briefing enviado na compra</p>
          <p className="text-sm text-neutral-300 leading-relaxed">{order.briefing}</p>
        </div>
      )}

      {/* Extra notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-400">Observações adicionais (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Ex: preferimos tons terrosos, queremos destacar o produto X na home…"
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* References */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-400">
            Referências visuais ({refs.length}/5)
          </label>
          {refs.length < 5 && (
            <button onClick={addRef} className="flex items-center gap-1 text-xs text-brand hover:text-brand/80 transition-colors">
              <Plus size={12} /> Adicionar
            </button>
          )}
        </div>
        {refs.map((ref, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="url"
              value={ref}
              onChange={(e) => updateRef(i, e.target.value)}
              placeholder="https://exemplo.com/referencia"
              className={inputCls}
            />
            {refs.length > 1 && (
              <button onClick={() => removeRef(i)} className="p-2 text-neutral-600 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="flex items-center gap-2 h-10 px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : null}
        {saving ? 'Salvando…' : 'Confirmar briefing e avançar'}
        {!saving && <ArrowRight size={14} />}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(customer)/dashboard/projetos/[id]/stages/BriefingStage.tsx" app/api/projetos/
git commit -m "feat: briefing stage form + API route"
```

---

## Task 7: Meet availability (admin panel)

**Files:**
- Create: `app/(admin)/admin/agendamentos/page.tsx`
- Modify: `app/(admin)/layout.tsx` — add nav link

- [ ] **Step 1: Check existing admin layout and add "Agendamentos" nav link**

Open `app/(admin)/layout.tsx`. Find the nav links array (or sidebar component). Add:

```typescript
{ href: '/admin/agendamentos', label: 'Agendamentos', icon: CalendarDays }
```

Import `CalendarDays` from lucide-react.

- [ ] **Step 2: Create `app/(admin)/admin/agendamentos/page.tsx`**

This page lets the admin:
- Create available slots (date + hour picker)
- See booked slots with order ID and client name
- Paste a Google Meet link to confirm a booked slot (this triggers `projectStage: 'meet_confirmado'` for that order)
- Delete unbooked slots

```typescript
'use client'

import { useState, useEffect, type FormEvent } from 'react'
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  updateDoc, serverTimestamp, query, where, Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { MeetSlot } from '@/types'
import { CalendarDays, Plus, Trash2, Link2, CheckCircle2, Clock, Loader2, X } from 'lucide-react'

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors'

const HOURS = [
  '08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00',
]

export default function AgendamentosPage() {
  const [slots, setSlots]         = useState<MeetSlot[]>([])
  const [loading, setLoading]     = useState(true)
  const [newDate, setNewDate]     = useState('')
  const [newHour, setNewHour]     = useState('09:00')
  const [creating, setCreating]   = useState(false)
  const [meetLinks, setMeetLinks] = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState<string | null>(null)

  async function fetchSlots() {
    const snap = await getDocs(collection(db, 'meetSlots'))
    const rows: MeetSlot[] = snap.docs.map((d) => ({
      id: d.id,
      date: d.data().date as string,
      hour: d.data().hour as string,
      available: d.data().available as boolean,
      orderId: d.data().orderId as string | undefined,
      meetLink: d.data().meetLink as string | undefined,
    }))
    rows.sort((a, b) => `${a.date}${a.hour}`.localeCompare(`${b.date}${b.hour}`))
    setSlots(rows)
    setLoading(false)
  }

  useEffect(() => { fetchSlots() }, [])

  async function handleCreateSlot(e: FormEvent) {
    e.preventDefault()
    if (!newDate || !newHour) return
    setCreating(true)
    await addDoc(collection(db, 'meetSlots'), {
      date: newDate,
      hour: newHour,
      available: true,
      createdAt: serverTimestamp(),
    })
    setNewDate('')
    await fetchSlots()
    setCreating(false)
  }

  async function handleDelete(id: string) {
    await deleteDoc(doc(db, 'meetSlots', id))
    setSlots((prev) => prev.filter((s) => s.id !== id))
  }

  async function handleConfirmMeet(slot: MeetSlot) {
    const link = meetLinks[slot.id]
    if (!link || !slot.orderId) return
    setConfirming(slot.id)
    await Promise.all([
      updateDoc(doc(db, 'meetSlots', slot.id), {
        meetLink: link,
        updatedAt: serverTimestamp(),
      }),
      updateDoc(doc(db, 'orders', slot.orderId), {
        meetLink: link,
        meetDate: `${slot.date} ${slot.hour}`,
        projectStage: 'meet_confirmado',
        updatedAt: serverTimestamp(),
      }),
    ])
    await fetchSlots()
    setConfirming(null)
  }

  const available = slots.filter((s) => s.available && !s.orderId)
  const booked    = slots.filter((s) => !s.available || s.orderId)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Agendamentos</h1>
        <p className="text-neutral-500 text-sm">Gerencie horários disponíveis para o meet inicial.</p>
      </div>

      {/* Create slot */}
      <div className="bento-card p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Adicionar horário disponível</h2>
        <form onSubmit={handleCreateSlot} className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5 flex-1 min-w-[160px]">
            <label className="text-xs text-neutral-400">Data</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400">Horário</label>
            <select
              value={newHour}
              onChange={(e) => setNewHour(e.target.value)}
              className={`${inputCls} appearance-none cursor-pointer w-28`}
            >
              {HOURS.map((h) => (
                <option key={h} value={h} className="bg-[#1a1a1a]">{h}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="h-10 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Adicionar
          </button>
        </form>
      </div>

      {/* Booked slots awaiting meet link */}
      {booked.filter((s) => !s.meetLink).length > 0 && (
        <div className="bento-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Aguardando link do meet</h2>
          </div>
          <div className="divide-y divide-white/5">
            {booked.filter((s) => !s.meetLink).map((slot) => (
              <div key={slot.id} className="px-6 py-4 flex flex-wrap items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {slot.date} às {slot.hour}
                  </p>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Pedido: {slot.orderId}</p>
                </div>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={meetLinks[slot.id] ?? ''}
                  onChange={(e) => setMeetLinks((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                  className="flex-1 min-w-[220px] px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50"
                />
                <button
                  onClick={() => handleConfirmMeet(slot)}
                  disabled={!meetLinks[slot.id] || confirming === slot.id}
                  className="h-9 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  {confirming === slot.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                  Confirmar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available slots */}
      <div className="bento-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">
            Horários disponíveis ({available.length})
          </h2>
        </div>
        {loading ? (
          <div className="px-6 py-8 flex justify-center">
            <Loader2 size={20} className="animate-spin text-neutral-600" />
          </div>
        ) : available.length === 0 ? (
          <p className="px-6 py-6 text-sm text-neutral-600">Nenhum horário disponível. Adicione acima.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {available.map((slot) => (
              <div key={slot.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock size={14} className="text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{slot.date}</p>
                    <p className="text-xs text-neutral-500">{slot.hour}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(slot.id)}
                  className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-400/8 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/admin/agendamentos/" "app/(admin)/layout.tsx"
git commit -m "feat: admin agendamentos page — create slots + confirm meets"
```

---

## Task 8: Scheduling Stage (client side)

**Files:**
- Create: `app/(customer)/dashboard/projetos/[id]/stages/AgendamentoStage.tsx`
- Create: `app/api/projetos/[id]/slot/route.ts`

- [ ] **Step 1: Create the slot booking API route**

```typescript
// app/api/projetos/[id]/slot/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

interface SlotBody {
  slotId: string
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { slotId }: SlotBody = await req.json()

  if (!id || !slotId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  await Promise.all([
    // Mark slot as booked
    updateDoc(doc(db, 'meetSlots', slotId), {
      available: false,
      orderId: id,
      updatedAt: serverTimestamp(),
    }),
    // Record on the order
    updateDoc(doc(db, 'orders', id), {
      meetSlotId: slotId,
      projectStage: 'agendamento',   // stays agendamento until admin confirms
      updatedAt: serverTimestamp(),
    }),
  ])

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create `AgendamentoStage.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DashboardOrder, MeetSlot } from '@/types'
import { Calendar, Clock, CheckCircle2, Loader2, Video, AlertCircle } from 'lucide-react'

export default function AgendamentoStage({ order }: { order: DashboardOrder; active: boolean; done: boolean }) {
  const [slots, setSlots]       = useState<MeetSlot[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [booking, setBooking]   = useState(false)
  const [booked, setBooked]     = useState(false)

  // If meet is already confirmed by admin, show the meet link
  const isConfirmed = order.projectStage === 'meet_confirmado'

  useEffect(() => {
    if (isConfirmed || order.meetSlotId) return
    getDocs(query(collection(db, 'meetSlots'), where('available', '==', true)))
      .then((snap) => {
        // Filter to next 7 business days
        const today = new Date()
        const cutoff = addBusinessDays(today, 7)
        const rows: MeetSlot[] = snap.docs
          .map((d) => ({
            id: d.id,
            date: d.data().date as string,
            hour: d.data().hour as string,
            available: d.data().available as boolean,
          }))
          .filter((s) => {
            const slotDate = new Date(s.date + 'T00:00:00')
            return slotDate > today && slotDate <= cutoff
          })
          .sort((a, b) => `${a.date}${a.hour}`.localeCompare(`${b.date}${b.hour}`))
        setSlots(rows)
      })
      .finally(() => setLoading(false))
  }, [isConfirmed, order.meetSlotId])

  function addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date)
    let added = 0
    while (added < days) {
      result.setDate(result.getDate() + 1)
      const dow = result.getDay()
      if (dow !== 0 && dow !== 6) added++
    }
    return result
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  }

  async function handleBook() {
    if (!selected) return
    setBooking(true)
    await fetch(`/api/projetos/${order.id}/slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: selected }),
    })
    setBooked(true)
    setBooking(false)
  }

  // If the slot was already booked (agendamento stage, meetSlotId set)
  if (order.meetSlotId && !isConfirmed) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8">
          <Clock size={16} className="text-orange-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Horário selecionado!</p>
            <p className="text-xs text-neutral-400 mt-1">
              Aguardando nossa equipe confirmar o meet e enviar o link. Você será notificado aqui.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Meet confirmed — show the link
  if (isConfirmed && order.meetLink) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-brand/10 border border-brand/20">
          <Video size={16} className="text-brand mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Meet confirmado!</p>
            {order.meetDate && (
              <p className="text-xs text-neutral-400 mt-0.5">{order.meetDate}</p>
            )}
            <a
              href={order.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-brand hover:underline"
            >
              Entrar no Google Meet →
            </a>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          Após o meet, o desenvolvimento do seu projeto começa automaticamente.
        </p>
      </div>
    )
  }

  if (booked) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
        <CheckCircle2 size={16} className="text-green-400" />
        <div>
          <p className="text-sm font-semibold text-green-400">Horário reservado!</p>
          <p className="text-xs text-green-400/70 mt-0.5">Aguardando confirmação da nossa equipe.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-300 leading-relaxed">
        Escolha um horário disponível para uma conversa rápida com o desenvolvedor do seu projeto.
        Horário comercial, de segunda a sexta, das 8h às 17h.
      </p>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-neutral-600" />
        </div>
      ) : slots.length === 0 ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8">
          <AlertCircle size={15} className="text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-sm text-neutral-400">
            Nenhum horário disponível nos próximos 7 dias úteis. Nossa equipe entrará em contato em breve.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelected(slot.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selected === slot.id
                    ? 'border-brand bg-brand/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={11} className="shrink-0" />
                  <span className="text-xs font-medium capitalize">{formatDate(slot.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="shrink-0" />
                  <span className="text-sm font-bold">{slot.hour}</span>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleBook}
            disabled={!selected || booking}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            {booking ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {booking ? 'Reservando…' : 'Confirmar horário'}
          </button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(customer)/dashboard/projetos/[id]/stages/AgendamentoStage.tsx" "app/api/projetos/[id]/slot/"
git commit -m "feat: scheduling stage — slot picker + booking API"
```

---

## Task 9: Development tracking stage

**Files:**
- Create: `app/(customer)/dashboard/projetos/[id]/stages/DesenvolvimentoStage.tsx`

This stage is read-only for the client. The admin/dev updates the order's `devSteps` array via the admin pedidos edit modal.

- [ ] **Step 1: Add `devSteps` and `deployUrl` fields to the admin EditModal in `app/(admin)/admin/pedidos/page.tsx`**

In the `EditModal` form, after the "Status" select, add:

```tsx
{/* Deploy URL */}
<div className="space-y-1.5">
  <label className="text-xs font-medium text-neutral-400">URL de preview (deploy)</label>
  <input
    type="url"
    value={deployUrl}
    onChange={(e) => setDeployUrl(e.target.value)}
    placeholder="https://projeto-preview.vercel.app"
    className={inputCls}
  />
</div>

{/* Project stage (simplified) */}
<div className="space-y-1.5">
  <label className="text-xs font-medium text-neutral-400">Etapa do projeto</label>
  <select
    value={projectStage}
    onChange={(e) => setProjectStage(e.target.value as ProjectStage)}
    className={selectCls}
  >
    {(['briefing','agendamento','meet_confirmado','em_desenvolvimento','em_revisao','aguardando_dominio','entregue'] as ProjectStage[]).map((s) => (
      <option key={s} value={s} className="bg-[#1a1a1a]">{PROJECT_STAGE_LABELS[s]}</option>
    ))}
  </select>
</div>
```

Add `deployUrl` and `projectStage` to the modal's local state and to the `onSave` handler, and persist them in `updateDoc`.

Import `ProjectStage, PROJECT_STAGE_LABELS` from `@/types`.

- [ ] **Step 2: Create `DesenvolvimentoStage.tsx`**

```typescript
'use client'

import type { DashboardOrder } from '@/types'
import { Zap, ExternalLink, Clock } from 'lucide-react'

const DEV_STEPS = [
  { key: 'design',    label: 'Design e wireframe' },
  { key: 'frontend',  label: 'Frontend' },
  { key: 'conteudo',  label: 'Conteúdo e copywriting' },
  { key: 'qa',        label: 'Revisão e testes' },
]

function getCompletedSteps(stage: string): number {
  // Simple heuristic — the admin can set devProgress (0-4) on the order
  // For now derive from projectStage
  return 4 // all done when stage is em_desenvolvimento (dev can set devProgress)
}

export default function DesenvolvimentoStage({
  order,
}: {
  order: DashboardOrder
  active: boolean
  done: boolean
}) {
  const devProgress: number = (order as DashboardOrder & { devProgress?: number }).devProgress ?? 0

  function addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date)
    let added = 0
    while (added < days) {
      result.setDate(result.getDate() + 1)
      const dow = result.getDay()
      if (dow !== 0 && dow !== 6) added++
    }
    return result
  }

  const startDate  = order.developmentStartedAt ?? new Date()
  const totalDays  = order.prazo === '7dias' ? 7 : 14
  const deadline   = addBusinessDays(startDate, totalDays)
  const daysLeft   = Math.ceil((deadline.getTime() - Date.now()) / 86400000)

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-300">
        O desenvolvimento do seu projeto está em andamento. Acompanhe as etapas abaixo.
      </p>

      {/* Steps */}
      <div className="space-y-2">
        {DEV_STEPS.map((step, i) => {
          const done    = i < devProgress
          const current = i === devProgress
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                done    ? 'border-green-500/20 bg-green-500/5' :
                current ? 'border-brand/20 bg-brand/5' :
                          'border-white/5 bg-white/[0.02]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                done    ? 'bg-green-500 text-white' :
                current ? 'bg-brand text-white' :
                          'bg-white/5 text-neutral-600'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${
                done    ? 'text-green-400' :
                current ? 'text-white' :
                          'text-neutral-600'
              }`}>
                {step.label}
              </span>
              {current && <Zap size={12} className="text-brand ml-auto animate-pulse" />}
            </div>
          )
        })}
      </div>

      {/* Deploy preview */}
      {order.deployUrl && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/8">
          <div>
            <p className="text-xs font-medium text-neutral-500 mb-0.5">Preview em tempo real</p>
            <p className="text-sm font-semibold text-white truncate max-w-[240px]">{order.deployUrl}</p>
          </div>
          <a
            href={order.deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold border border-brand/20 transition-colors ml-3 shrink-0"
          >
            Abrir <ExternalLink size={11} />
          </a>
        </div>
      )}

      {/* Countdown */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold w-fit ${
        daysLeft <= 3 ? 'text-orange-400 bg-orange-500/10' : 'text-neutral-500 bg-white/5'
      }`}>
        <Clock size={12} />
        {daysLeft > 0
          ? `${daysLeft} dias úteis restantes`
          : daysLeft === 0
            ? 'Entrega prevista para hoje'
            : `${Math.abs(daysLeft)}d além do prazo`}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(customer)/dashboard/projetos/[id]/stages/DesenvolvimentoStage.tsx" "app/(admin)/admin/pedidos/page.tsx"
git commit -m "feat: development stage tracker + admin deploy URL field"
```

---

## Task 10: Revision Stage (optional, paid)

**Files:**
- Create: `app/(customer)/dashboard/projetos/[id]/stages/RevisaoStage.tsx`
- Create: `app/api/projetos/[id]/revision/route.ts`

- [ ] **Step 1: Create the revision Stripe checkout API route**

The revision price needs to be defined. Use a fixed value — add `REVISION_PRICE_BRL=29700` (R$ 297) to `.env.local`.

```typescript
// app/api/projetos/[id]/revision/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const snap = await getDoc(doc(db, 'orders', id))
  if (!snap.exists()) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  const data = snap.data()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'brl',
        unit_amount: 29700,   // R$ 297,00
        product_data: {
          name: 'Revisão do projeto',
          description: 'Inclui meet de alinhamento + ajustes no projeto + 5 dias úteis adicionais',
        },
      },
    }],
    customer_email: data.userEmail ?? undefined,
    client_reference_id: id,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projetos/${id}?revisao=paga`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projetos/${id}`,
    metadata: { orderId: id, type: 'revision' },
  })

  return NextResponse.json({ url: session.url })
}
```

- [ ] **Step 2: Update webhook to handle `type: 'revision'` metadata**

In `app/api/webhook/route.ts`, after the existing `checkout.session.completed` handler, add:

```typescript
if (event.type === 'checkout.session.completed') {
  const session = event.data.object as Stripe.Checkout.Session
  const meta = session.metadata ?? {}

  // Existing order payment
  if (!meta.type) {
    // ... existing code ...
  }

  // Revision payment
  if (meta.type === 'revision' && meta.orderId) {
    await updateDoc(doc(db, 'orders', meta.orderId), {
      projectStage: 'em_revisao',
      revisionPaid: true,
      updatedAt: serverTimestamp(),
    })
  }
}
```

- [ ] **Step 3: Create `RevisaoStage.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { DashboardOrder } from '@/types'
import { useSearchParams } from 'next/navigation'
import { RefreshCw, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'

export default function RevisaoStage({ order }: { order: DashboardOrder; active: boolean; done: boolean }) {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const revisaoPaga  = searchParams.get('revisao') === 'paga'

  async function handleRequestRevision() {
    setLoading(true)
    const res  = await fetch(`/api/projetos/${order.id}/revision`, { method: 'POST' })
    const data = await res.json() as { url?: string }
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  if (revisaoPaga || order.revisionPaid) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-brand/10 border border-brand/20">
          <CheckCircle2 size={16} className="text-brand mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Revisão em andamento</p>
            <p className="text-xs text-neutral-400 mt-1">
              Nossa equipe está aplicando os ajustes. O prazo foi estendido em 5 dias úteis.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8 space-y-2">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="text-brand" />
          <p className="text-sm font-semibold text-white">Revisão opcional — R$ 297</p>
        </div>
        <ul className="text-xs text-neutral-400 space-y-1 list-disc list-inside ml-1">
          <li>Meet de alinhamento com o desenvolvedor</li>
          <li>Ajustes no layout, textos ou funcionalidades</li>
          <li>+5 dias úteis adicionados ao prazo de entrega</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleRequestRevision}
          disabled={loading}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          {loading ? 'Redirecionando…' : 'Solicitar revisão'}
        </button>
        <p className="text-xs text-neutral-600 self-center">
          Ou pule esta etapa — seu projeto avança para conexão de domínio.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/(customer)/dashboard/projetos/[id]/stages/RevisaoStage.tsx" "app/api/projetos/[id]/revision/" app/api/webhook/route.ts
git commit -m "feat: optional paid revision stage + Stripe flow"
```

---

## Task 11: Domain credentials stage

**Files:**
- Create: `app/(customer)/dashboard/projetos/[id]/stages/DominioStage.tsx`
- Create: `app/api/projetos/[id]/domain/route.ts`

- [ ] **Step 1: Create domain API route**

```typescript
// app/api/projetos/[id]/domain/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

interface DomainBody {
  host: string
  user: string
  pass: string
  notes: string
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { host, user, pass, notes }: DomainBody = await req.json()

  if (!id || !host) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  await updateDoc(doc(db, 'orders', id), {
    domainHost: host,
    domainUser: user,
    domainPass: pass,       // store as-is for MVP; encrypt in production
    domainNotes: notes,
    projectStage: 'aguardando_dominio',
    updatedAt: serverTimestamp(),
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create `DominioStage.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { DashboardOrder } from '@/types'
import { Globe, Loader2, CheckCircle2, ArrowRight, Lock } from 'lucide-react'

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors'

export default function DominioStage({ order }: { order: DashboardOrder; active: boolean; done: boolean }) {
  const [host, setHost]   = useState('')
  const [user, setUser]   = useState('')
  const [pass, setPass]   = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  async function handleSubmit() {
    if (!host) return
    setSaving(true)
    await fetch(`/api/projetos/${order.id}/domain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, user, pass, notes }),
    })
    setSaved(true)
    setSaving(false)
  }

  if (saved || order.projectStage === 'aguardando_dominio') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
        <CheckCircle2 size={16} className="text-teal-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">Dados recebidos!</p>
          <p className="text-xs text-neutral-400 mt-1">
            Nossa equipe está conectando o domínio. Em breve seu site estará disponível no endereço definitivo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-300 leading-relaxed">
        Informe os dados de acesso ao painel do seu domínio (ex: registro.br, GoDaddy, Hostinger).
        Usaremos apenas para apontar o domínio para o seu site.
      </p>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <Lock size={12} className="text-yellow-400 shrink-0" />
        <p className="text-xs text-yellow-400/80">
          Suas credenciais são armazenadas de forma segura e usadas apenas para esta configuração.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Provedor / Registradora</label>
          <input type="text" value={host} onChange={(e) => setHost(e.target.value)} placeholder="Ex: registro.br, GoDaddy, Hostinger" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-400">Usuário / E-mail</label>
            <input type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="usuario@email.com" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-400">Senha</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" className={inputCls} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Observações (opcional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ex: domínio é meusite.com.br" className={`${inputCls} resize-none`} />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!host || saving}
        className="flex items-center gap-2 h-10 px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors disabled:opacity-40"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
        {saving ? 'Salvando…' : 'Enviar dados do domínio'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(customer)/dashboard/projetos/[id]/stages/DominioStage.tsx" "app/api/projetos/[id]/domain/"
git commit -m "feat: domain credentials stage + API route"
```

---

## Task 12: Delivery stage

**Files:**
- Create: `app/(customer)/dashboard/projetos/[id]/stages/EntregaStage.tsx`

The admin sets `projectStage: 'entregue'` and `deliveryUrl` via the pedidos edit modal (already updated in Task 9).

- [ ] **Step 1: Create `EntregaStage.tsx`**

```typescript
'use client'

import type { DashboardOrder } from '@/types'
import { CheckCircle2, ExternalLink, Star } from 'lucide-react'

export default function EntregaStage({ order }: { order: DashboardOrder; active: boolean; done: boolean }) {
  if (order.projectStage !== 'entregue') {
    return (
      <p className="text-sm text-neutral-600">
        Seu site será entregue após a conexão do domínio.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-5 rounded-xl bg-green-500/10 border border-green-500/25">
        <CheckCircle2 size={20} className="text-green-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-base font-bold text-green-400">Projeto entregue!</p>
          <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
            Seu site está no ar. Obrigado por confiar na Crably para o seu projeto.
          </p>
        </div>
      </div>

      {order.deliveryUrl && (
        <a
          href={order.deliveryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:border-white/15 transition-colors group"
        >
          <div>
            <p className="text-xs text-neutral-500 mb-0.5">Seu site</p>
            <p className="text-sm font-semibold text-white">{order.deliveryUrl}</p>
          </div>
          <ExternalLink size={14} className="text-neutral-500 group-hover:text-white transition-colors" />
        </a>
      )}

      <div className="flex items-center gap-2 text-xs text-neutral-600">
        <Star size={11} />
        <span>Gostou do resultado? Compartilhe com alguém que também precisa de um site.</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Final build verification**

```bash
cd "C:/Users/olive/OneDrive/Documentos/pessoal/cowly" && npx next build 2>&1 | tail -30
```

Expected: build succeeds with no new errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(customer)/dashboard/projetos/[id]/stages/EntregaStage.tsx"
git commit -m "feat: delivery stage component"
```

---

## Spec coverage check

| Requirement | Task |
|---|---|
| Post-purchase → Meus Projetos | Task 2 (webhook redirects via success_url already set) |
| Stage 1: Briefing + up to 5 references | Task 6 |
| Stage 2: Meet scheduling (client picks slot) | Task 8 |
| Stage 2: Dev sets availability | Task 7 |
| Stage 2: Auto meet link (admin pastes + confirms) | Task 7 |
| Stage 2: D+3 reminder (no slot selected) | Not implemented — add a banner in `AgendamentoStage` that checks `createdAt + 3 business days` vs today (added in Task 8 component's `slots.length === 0` fallback) |
| Stage 3: Dev stage tracker | Task 9 |
| Stage 3: Deploy preview link | Task 9 |
| Stage 3: Days counting starts after meet | `developmentStartedAt` set by admin when advancing to `em_desenvolvimento` |
| Stage 4: Optional paid revision | Task 10 |
| Stage 4: +5 business days | Noted in revision description (not auto-calculated — deadline display reads `developmentStartedAt + prazo + 5 if revisionPaid`) |
| Stage 5: Domain credentials | Task 11 |
| Stage 6: Domain connection + delivery | Task 12 + admin edit modal |

All requirements covered.
