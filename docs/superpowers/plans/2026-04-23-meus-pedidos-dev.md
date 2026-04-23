# Meus Pedidos (Dev/Admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Meus Pedidos" page to the admin panel where developers (and admins acting as devs) can see only their assigned orders and manage development progress, stage, and deploy URL.

**Architecture:** Client component page at `app/(admin)/admin/meus-pedidos/` queries Firestore for orders where `assignedDevId === currentUser.uid`. Each order is rendered as a `DevOrderCard` that allows inline updates to `devProgress`, `deployUrl`, and `projectStage` via direct `updateDoc` calls — the same pattern used by `agendamentos/page.tsx`. The sidebar gains a new nav link visible to both `developer` and `admin` roles.

**Tech Stack:** Next.js App Router, TypeScript, Firebase Firestore (client SDK), Tailwind CSS v4, lucide-react, `useAuth()` from `@/contexts/AuthContext`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `types/index.ts` | Add `assignedDevId`, `devProgress`, domain fields to `DashboardOrder` |
| Create | `app/(admin)/admin/meus-pedidos/DevOrderCard.tsx` | Single card component: header, stepper, deploy URL, briefing, domain, advance stage |
| Create | `app/(admin)/admin/meus-pedidos/page.tsx` | Page: fetch filtered orders, render cards, empty state |
| Modify | `components/admin/Sidebar.tsx` | Add "Meus Pedidos" nav link |

---

## Task 1: Extend DashboardOrder type

**Files:**
- Modify: `types/index.ts:117-139`

`DashboardOrder` is missing `assignedDevId`, `devProgress`, and domain credential fields that already exist in Firestore but aren't typed. Fix this so downstream components can use them without casting.

- [ ] **Step 1: Open `types/index.ts` and replace the `DashboardOrder` interface**

Replace the existing `DashboardOrder` interface (lines 117–139) with:

```typescript
export interface DashboardOrder {
  id: string
  userId: string
  assignedDevId: string | null
  productName: string
  productType: string
  projectName: string
  briefing: string
  reference: string
  prazo: '14dias' | '7dias'
  price: number
  stripeSessionId: string
  deliveryUrl: string | null
  createdAt: Date
  projectStage: ProjectStage
  meetLink: string | null
  meetDate: string | null
  deployUrl: string | null
  devProgress: number
  revisionPaid: boolean
  developmentStartedAt: Date | null
  briefingNotes?: string
  references?: string[]
  meetSlotId?: string
  domainHost?: string
  domainUser?: string
  domainPass?: string
  domainNotes?: string
}
```

- [ ] **Step 2: Fix the cast in `DesenvolvimentoStage.tsx`**

In `app/(customer)/dashboard/projetos/[id]/stages/DesenvolvimentoStage.tsx`, line 25, replace:

```typescript
const devProgress: number = (order as DashboardOrder & { devProgress?: number }).devProgress ?? 0
```

with:

```typescript
const devProgress: number = order.devProgress ?? 0
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "/c/Users/olive/OneDrive/Documentos/pessoal/cowly"
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to `DashboardOrder`.

- [ ] **Step 4: Commit**

```bash
git add types/index.ts app/\(customer\)/dashboard/projetos/\[id\]/stages/DesenvolvimentoStage.tsx
git commit -m "feat: add assignedDevId, devProgress, domain fields to DashboardOrder"
```

---

## Task 2: Create DevOrderCard component

**Files:**
- Create: `app/(admin)/admin/meus-pedidos/DevOrderCard.tsx`

This is the main UI component. It receives a `DashboardOrder` and a callback to refresh the list after a Firestore write. It has 5 sections: header, dev progress stepper, deploy URL field, briefing (collapsible), domain credentials (conditional), and an advance-stage button.

- [ ] **Step 1: Create the file with full content**

Create `app/(admin)/admin/meus-pedidos/DevOrderCard.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DashboardOrder, ProjectStage } from '@/types'
import {
  ChevronDown, ChevronUp, ExternalLink, Loader2,
  Clock, CheckCircle2, Zap, AlertTriangle, Lock,
} from 'lucide-react'

const DEV_STEPS = [
  { key: 'design',   label: 'Design e wireframe' },
  { key: 'frontend', label: 'Frontend' },
  { key: 'conteudo', label: 'Conteúdo e copywriting' },
  { key: 'qa',       label: 'Revisão e testes' },
]

const STAGE_COLORS: Partial<Record<ProjectStage, string>> = {
  em_desenvolvimento: 'text-brand bg-brand/10 border-brand/20',
  em_revisao:         'text-orange-400 bg-orange-400/10 border-orange-400/20',
  aguardando_dominio: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  entregue:           'text-green-400 bg-green-400/10 border-green-400/20',
}

const STAGE_LABELS: Partial<Record<ProjectStage, string>> = {
  em_desenvolvimento: 'Em desenvolvimento',
  em_revisao:         'Em revisão',
  aguardando_dominio: 'Aguardando domínio',
  entregue:           'Entregue',
}

const ADVANCE: Partial<Record<ProjectStage, { label: string; next: ProjectStage }>> = {
  em_desenvolvimento: { label: 'Enviar para revisão',  next: 'em_revisao' },
  em_revisao:         { label: 'Aguardando domínio',   next: 'aguardando_dominio' },
  aguardando_dominio: { label: 'Marcar como entregue', next: 'entregue' },
}

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

interface Props {
  order: DashboardOrder
  onRefresh: () => void
}

export default function DevOrderCard({ order, onRefresh }: Props) {
  const [briefingOpen, setBriefingOpen] = useState(false)
  const [deployInput, setDeployInput]   = useState(order.deployUrl ?? '')
  const [savingDeploy, setSavingDeploy] = useState(false)
  const [savingStep, setSavingStep]     = useState<number | null>(null)
  const [advancing, setAdvancing]       = useState(false)

  const devProgress = order.devProgress ?? 0

  // Deadline calculation
  const startDate = order.developmentStartedAt ?? null
  const totalDays = order.prazo === '7dias' ? 7 : 14
  const deadline  = startDate ? addBusinessDays(startDate, totalDays) : null
  const daysLeft  = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null

  const stageColor = STAGE_COLORS[order.projectStage] ?? 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20'
  const stageLabel = STAGE_LABELS[order.projectStage] ?? order.projectStage
  const advance    = ADVANCE[order.projectStage]

  async function handleStepClick(stepIndex: number) {
    // stepIndex 0-3; clicking a step sets devProgress = stepIndex + 1
    // clicking the current active step resets to stepIndex (undo)
    const newProgress = devProgress === stepIndex + 1 ? stepIndex : stepIndex + 1
    setSavingStep(stepIndex)
    await updateDoc(doc(db, 'orders', order.id), {
      devProgress: newProgress,
      updatedAt: serverTimestamp(),
    })
    onRefresh()
    setSavingStep(null)
  }

  async function handleSaveDeploy() {
    setSavingDeploy(true)
    await updateDoc(doc(db, 'orders', order.id), {
      deployUrl: deployInput.trim() || null,
      updatedAt: serverTimestamp(),
    })
    onRefresh()
    setSavingDeploy(false)
  }

  async function handleAdvance() {
    if (!advance) return
    setAdvancing(true)
    await updateDoc(doc(db, 'orders', order.id), {
      projectStage: advance.next,
      updatedAt: serverTimestamp(),
    })
    onRefresh()
    setAdvancing(false)
  }

  const showDomain =
    order.projectStage === 'aguardando_dominio' || order.projectStage === 'entregue'

  return (
    <div className="bento-card p-5 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-neutral-500 mb-0.5">{order.productType}</p>
          <h3 className="text-base font-bold text-white truncate">{order.projectName}</h3>
          {order.createdAt && (
            <p className="text-xs text-neutral-600 mt-0.5">
              {order.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${stageColor}`}>
            {stageLabel}
          </span>
          {daysLeft !== null && (
            <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              daysLeft <= 3 ? 'text-orange-400 bg-orange-500/10' : 'text-neutral-500 bg-white/5'
            }`}>
              <Clock size={10} />
              {daysLeft > 0
                ? `${daysLeft}d úteis`
                : daysLeft === 0
                  ? 'Entrega hoje'
                  : `${Math.abs(daysLeft)}d atrasado`}
            </span>
          )}
        </div>
      </div>

      {/* ── Dev Progress Stepper ── */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Progresso</p>
        {DEV_STEPS.map((step, i) => {
          const done    = i < devProgress
          const current = i === devProgress
          const loading = savingStep === i
          return (
            <button
              key={step.key}
              onClick={() => handleStepClick(i)}
              disabled={loading !== false && savingStep !== null}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                done    ? 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10' :
                current ? 'border-brand/20 bg-brand/5 hover:bg-brand/10' :
                          'border-white/5 bg-white/[0.02] hover:bg-white/5'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                done    ? 'bg-green-500 text-white' :
                current ? 'bg-brand text-white' :
                          'bg-white/5 text-neutral-600'
              }`}>
                {loading ? <Loader2 size={10} className="animate-spin" /> :
                 done    ? <CheckCircle2 size={10} /> :
                           i + 1}
              </div>
              <span className={`text-sm font-medium flex-1 ${
                done    ? 'text-green-400' :
                current ? 'text-white' :
                          'text-neutral-600'
              }`}>
                {step.label}
              </span>
              {current && <Zap size={11} className="text-brand animate-pulse shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* ── Deploy URL ── */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">URL de Preview</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={deployInput}
            onChange={(e) => setDeployInput(e.target.value)}
            placeholder="https://preview.vercel.app"
            className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors"
          />
          <button
            onClick={handleSaveDeploy}
            disabled={savingDeploy}
            className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors disabled:opacity-50 shrink-0"
          >
            {savingDeploy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Salvar
          </button>
          {deployInput && (
            <a
              href={deployInput.startsWith('http') ? deployInput : `https://${deployInput}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 transition-colors shrink-0"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      {/* ── Briefing (collapsible) ── */}
      <div className="border border-white/8 rounded-xl overflow-hidden">
        <button
          onClick={() => setBriefingOpen(o => !o)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          Briefing do cliente
          {briefingOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {briefingOpen && (
          <div className="px-3.5 pb-3.5 space-y-3 border-t border-white/5 pt-3">
            <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">{order.briefing}</p>
            {order.briefingNotes && (
              <div>
                <p className="text-xs font-semibold text-neutral-500 mb-1">Notas adicionais</p>
                <p className="text-sm text-neutral-400 whitespace-pre-wrap">{order.briefingNotes}</p>
              </div>
            )}
            {order.references && order.references.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-neutral-500 mb-1">Referências</p>
                <div className="space-y-1">
                  {order.references.map((ref, i) => (
                    <a
                      key={i}
                      href={ref.startsWith('http') ? ref : `https://${ref}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-brand hover:underline truncate"
                    >
                      <ExternalLink size={10} />
                      {ref}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Domain Credentials (conditional) ── */}
      {showDomain && (order.domainHost || order.domainUser) && (
        <div className="border border-purple-500/20 bg-purple-500/5 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="text-purple-400" />
            <p className="text-xs font-semibold text-purple-400">Credenciais de domínio</p>
          </div>
          <div className="flex items-start gap-1.5 text-[11px] text-orange-400/80">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
            <span>Não compartilhe estas credenciais.</span>
          </div>
          {order.domainHost && (
            <div>
              <p className="text-[10px] text-neutral-600 mb-0.5">Host / Painel</p>
              <p className="text-xs text-neutral-300 font-mono">{order.domainHost}</p>
            </div>
          )}
          {order.domainUser && (
            <div>
              <p className="text-[10px] text-neutral-600 mb-0.5">Usuário</p>
              <p className="text-xs text-neutral-300 font-mono">{order.domainUser}</p>
            </div>
          )}
          {order.domainPass && (
            <div>
              <p className="text-[10px] text-neutral-600 mb-0.5">Senha</p>
              <p className="text-xs text-neutral-300 font-mono">{order.domainPass}</p>
            </div>
          )}
          {order.domainNotes && (
            <div>
              <p className="text-[10px] text-neutral-600 mb-0.5">Observações</p>
              <p className="text-xs text-neutral-400">{order.domainNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Advance Stage ── */}
      {advance && (
        <button
          onClick={handleAdvance}
          disabled={advancing}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors disabled:opacity-40 w-full justify-center"
        >
          {advancing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {advance.label}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify the file was created**

```bash
ls "/c/Users/olive/OneDrive/Documentos/pessoal/cowly/app/(admin)/admin/meus-pedidos/"
```

Expected: `DevOrderCard.tsx` listed.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "/c/Users/olive/OneDrive/Documentos/pessoal/cowly"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in `DevOrderCard.tsx`.

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/meus-pedidos/DevOrderCard.tsx"
git commit -m "feat: DevOrderCard component for dev order management"
```

---

## Task 3: Create the Meus Pedidos page

**Files:**
- Create: `app/(admin)/admin/meus-pedidos/page.tsx`

Client component that reads the current user's UID from `useAuth()`, queries Firestore for orders where `assignedDevId === uid`, maps raw documents to `DashboardOrder`, and renders a responsive grid of `DevOrderCard` components.

- [ ] **Step 1: Create the page file**

Create `app/(admin)/admin/meus-pedidos/page.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { DashboardOrder, ProjectStage } from '@/types'
import { Briefcase, Loader2 } from 'lucide-react'
import DevOrderCard from './DevOrderCard'

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(value as string)
}

export default function MeusPedidosPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders]   = useState<DashboardOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!user?.uid) return
    setLoading(true)
    const snap = await getDocs(
      query(collection(db, 'orders'), where('assignedDevId', '==', user.uid))
    )
    const rows: DashboardOrder[] = snap.docs.map((d) => {
      const data = d.data()
      return {
        id:                   d.id,
        userId:               data.userId ?? '',
        assignedDevId:        data.assignedDevId ?? null,
        productName:          data.productName ?? '',
        productType:          data.productType ?? '',
        projectName:          data.projectName ?? data.productName ?? '',
        briefing:             data.briefing ?? '',
        reference:            data.reference ?? '',
        prazo:                data.prazo ?? '14dias',
        price:                data.price ?? 0,
        stripeSessionId:      data.stripeSessionId ?? '',
        deliveryUrl:          data.deliveryUrl ?? null,
        createdAt:            toDate(data.createdAt),
        projectStage:         (data.projectStage ?? 'em_desenvolvimento') as ProjectStage,
        meetLink:             data.meetLink ?? null,
        meetDate:             data.meetDate ?? null,
        deployUrl:            data.deployUrl ?? null,
        devProgress:          data.devProgress ?? 0,
        revisionPaid:         data.revisionPaid ?? false,
        developmentStartedAt: data.developmentStartedAt ? toDate(data.developmentStartedAt) : null,
        briefingNotes:        data.briefingNotes,
        references:           data.references,
        meetSlotId:           data.meetSlotId,
        domainHost:           data.domainHost,
        domainUser:           data.domainUser,
        domainPass:           data.domainPass,
        domainNotes:          data.domainNotes,
      }
    })
    rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    setOrders(rows)
    setLoading(false)
  }, [user?.uid])

  useEffect(() => {
    if (!authLoading) fetchOrders()
  }, [authLoading, fetchOrders])

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={24} className="animate-spin text-neutral-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Meus Pedidos</h1>
        <p className="text-neutral-500 text-sm">
          {orders.length === 0
            ? 'Nenhum pedido atribuído a você ainda.'
            : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} atribuído${orders.length !== 1 ? 's' : ''} a você.`}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-neutral-600">
          <Briefcase size={36} strokeWidth={1.5} />
          <p className="text-sm">Nenhum pedido atribuído a você ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {orders.map((order) => (
            <DevOrderCard key={order.id} order={order} onRefresh={fetchOrders} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/c/Users/olive/OneDrive/Documentos/pessoal/cowly"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/admin/meus-pedidos/page.tsx"
git commit -m "feat: Meus Pedidos page for dev/admin"
```

---

## Task 4: Add sidebar nav link

**Files:**
- Modify: `components/admin/Sidebar.tsx:8-37`

Add `Briefcase` to the lucide-react import and add the new route to the `NAV` array.

- [ ] **Step 1: Add `Briefcase` to the import line**

In `components/admin/Sidebar.tsx`, find the lucide-react import block (lines 8–21) and add `Briefcase`:

```tsx
import {
  LayoutDashboard,
  Globe,
  Users,
  MessageSquare,
  Code2,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Menu,
  CalendarDays,
  Briefcase,
} from 'lucide-react'
```

- [ ] **Step 2: Add the nav entry to the `NAV` array**

In `components/admin/Sidebar.tsx`, find the `NAV` array (lines 29–37) and add the new entry after `Agendamentos`:

```tsx
const NAV = [
  { href: '/admin',             label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: '/admin/pedidos',     label: 'Pedidos',       icon: Package },
  { href: '/admin/templates',   label: 'Sites',         icon: Globe },
  { href: '/admin/clientes',    label: 'Clientes',      icon: Users },
  { href: '/admin/tickets',     label: 'Tickets',       icon: MessageSquare },
  { href: '/admin/devs',        label: 'Devs',          icon: Code2 },
  { href: '/admin/agendamentos',label: 'Agendamentos',  icon: CalendarDays },
  { href: '/admin/meus-pedidos',label: 'Meus Pedidos',  icon: Briefcase },
]
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "/c/Users/olive/OneDrive/Documentos/pessoal/cowly"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Verify in browser**

Start the dev server (`npm run dev`) and navigate to `http://localhost:3000/admin`. The sidebar should show "Meus Pedidos" below "Agendamentos". Clicking it should load the page — either the empty state or a grid of assigned orders.

- [ ] **Step 5: Commit**

```bash
git add components/admin/Sidebar.tsx
git commit -m "feat: add Meus Pedidos link to admin sidebar"
```
