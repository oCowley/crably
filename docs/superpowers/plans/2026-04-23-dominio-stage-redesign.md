# DominioStage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the credential-collection domain stage with a DNS-guided flow where the client adds two DNS records themselves and submits only their domain name.

**Architecture:** Four sequential file changes: (1) update `DashboardOrder` type to replace credential fields with `domainName`, (2) rewrite `DominioStage.tsx` with the new DNS tutorial UI, (3) slim down the API route to accept only `domainName`, (4) update `DevOrderCard` to display `domainName` instead of credentials.

**Tech Stack:** Next.js App Router, TypeScript, Firebase Firestore client SDK, Tailwind CSS v4, lucide-react.

---

## File Map

| Action | Path | Change |
|--------|------|--------|
| Modify | `types/index.ts` | Replace `domainHost/User/Pass/Notes` with `domainName?: string` in `DashboardOrder` |
| Modify | `app/(customer)/dashboard/projetos/[id]/stages/DominioStage.tsx` | Full rewrite — DNS guide UI |
| Modify | `app/api/projetos/[id]/domain/route.ts` | Accept `{ domainName }` only |
| Modify | `app/(admin)/admin/meus-pedidos/DevOrderCard.tsx` | Show `domainName` instead of credentials |

---

## Task 1: Update DashboardOrder type

**Files:**
- Modify: `types/index.ts`

Remove the four credential fields and add `domainName` to `DashboardOrder`.

- [ ] **Step 1: Open `types/index.ts` and update `DashboardOrder`**

Find the current interface (it ends around line 145). Replace the four domain credential fields:

```typescript
// REMOVE these four lines:
domainHost?: string
domainUser?: string
domainPass?: string
domainNotes?: string

// ADD this one line in their place:
domainName?: string
```

The final bottom of the `DashboardOrder` interface should look like:

```typescript
  briefingNotes?: string
  references?: string[]
  meetSlotId?: string
  domainName?: string
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/c/Users/olive/OneDrive/Documentos/pessoal/cowly"
npx tsc --noEmit 2>&1 | head -30
```

Expected: errors only in `DevOrderCard.tsx` (references old credential fields — will be fixed in Task 4). No errors in `types/index.ts` itself.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/olive/OneDrive/Documentos/pessoal/cowly"
git add types/index.ts
git commit -m "feat: replace domain credential fields with domainName in DashboardOrder"
```

---

## Task 2: Rewrite DominioStage

**Files:**
- Modify: `app/(customer)/dashboard/projetos/[id]/stages/DominioStage.tsx`

Full replacement with the DNS-guided UI: domain input, DNS records table with copy buttons, collapsible tutorial, checkbox confirmation, submit.

- [ ] **Step 1: Replace the entire file content**

```tsx
'use client'

import { useState } from 'react'
import type { DashboardOrder } from '@/types'
import { Globe, Loader2, CheckCircle2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

const DNS_RECORDS = [
  { type: 'A',     name: '@',   value: '76.76.21.21',         ttl: 'Auto' },
  { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com', ttl: 'Auto' },
]

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors'

export default function DominioStage({ order }: { order: DashboardOrder; active: boolean; done: boolean }) {
  const [domainName, setDomainName] = useState('')
  const [confirmed, setConfirmed]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [tutorialOpen, setTutorial] = useState(false)
  const [copied, setCopied]         = useState<string | null>(null)

  const isConfirmed =
    saved ||
    order.projectStage === 'aguardando_dominio' ||
    order.projectStage === 'entregue'

  async function handleCopy(value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(value)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleSubmit() {
    if (!domainName.trim() || !confirmed) return
    setSaving(true)
    await fetch(`/api/projetos/${order.id}/domain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domainName: domainName.trim() }),
    })
    setSaved(true)
    setSaving(false)
  }

  if (isConfirmed) {
    const name = order.domainName ?? domainName
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
        <CheckCircle2 size={16} className="text-teal-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">Domínio recebido!</p>
          {name && (
            <p className="text-xs text-teal-400 font-mono mt-0.5">{name}</p>
          )}
          <p className="text-xs text-neutral-400 mt-1">
            Nossa equipe vai conectar seu domínio ao site em breve.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-300 leading-relaxed">
        Para conectar seu domínio ao site, você precisa adicionar dois registros DNS
        no painel da sua registradora (onde você comprou o domínio).
      </p>

      {/* Domain input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-400">Seu domínio</label>
        <input
          type="text"
          value={domainName}
          onChange={(e) => setDomainName(e.target.value)}
          placeholder="meusite.com.br"
          className={inputCls}
        />
      </div>

      {/* DNS records table */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-neutral-400">Registros DNS para adicionar</p>
        <div className="rounded-xl border border-white/8 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[60px_60px_1fr_60px_36px] gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/5">
            {['Tipo', 'Nome', 'Valor', 'TTL', ''].map((h) => (
              <span key={h} className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">{h}</span>
            ))}
          </div>
          {/* Rows */}
          {DNS_RECORDS.map((rec) => (
            <div
              key={rec.type}
              className="grid grid-cols-[60px_60px_1fr_60px_36px] gap-2 items-center px-3 py-2.5 border-b border-white/5 last:border-0"
            >
              <span className="text-xs font-mono font-bold text-brand">{rec.type}</span>
              <span className="text-xs font-mono text-neutral-300">{rec.name}</span>
              <span className="text-xs font-mono text-white truncate">{rec.value}</span>
              <span className="text-xs text-neutral-500">{rec.ttl}</span>
              <button
                onClick={() => handleCopy(rec.value)}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
                title={`Copiar ${rec.value}`}
              >
                {copied === rec.value
                  ? <Check size={12} className="text-green-400" />
                  : <Copy size={12} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tutorial collapsible */}
      <div className="border border-white/8 rounded-xl overflow-hidden">
        <button
          onClick={() => setTutorial(o => !o)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          Como fazer isso?
          {tutorialOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {tutorialOpen && (
          <div className="px-3.5 pb-4 pt-3 border-t border-white/5 space-y-2.5">
            {[
              'Acesse o painel da sua registradora (onde você comprou o domínio)',
              'Procure por "DNS", "Zona DNS" ou "Gerenciar DNS"',
              'Adicione os dois registros acima exatamente como mostrado',
              'Salve as alterações — a propagação pode levar até 48h',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand/15 text-brand text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-neutral-400 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
            confirmed ? 'bg-brand border-brand' : 'border-white/20 bg-white/5 group-hover:border-white/40'
          }`}>
            {confirmed && <Check size={10} className="text-white" strokeWidth={3} />}
          </div>
        </div>
        <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors leading-relaxed">
          Já adicionei os registros DNS na minha registradora
        </span>
      </label>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!domainName.trim() || !confirmed || saving}
        className="flex items-center gap-2 h-10 px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors disabled:opacity-40"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
        {saving ? 'Salvando…' : 'Confirmar domínio'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/c/Users/olive/OneDrive/Documentos/pessoal/cowly"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in `DominioStage.tsx`.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/olive/OneDrive/Documentos/pessoal/cowly"
git add "app/(customer)/dashboard/projetos/[id]/stages/DominioStage.tsx"
git commit -m "feat: rewrite DominioStage with DNS guide and domainName field"
```

---

## Task 3: Update domain API route

**Files:**
- Modify: `app/api/projetos/[id]/domain/route.ts`

Accept `{ domainName }` only; write only `domainName` to Firestore.

- [ ] **Step 1: Replace the entire file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { domainName } = await req.json() as { domainName: string }

  if (!id || !domainName?.trim()) {
    return NextResponse.json({ error: 'Missing domainName' }, { status: 400 })
  }

  await updateDoc(doc(db, 'orders', id), {
    domainName: domainName.trim(),
    projectStage: 'aguardando_dominio',
    updatedAt: serverTimestamp(),
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/c/Users/olive/OneDrive/Documentos/pessoal/cowly"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in the route file.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/olive/OneDrive/Documentos/pessoal/cowly"
git add "app/api/projetos/[id]/domain/route.ts"
git commit -m "feat: update domain API route to accept domainName only"
```

---

## Task 4: Update DevOrderCard domain section

**Files:**
- Modify: `app/(admin)/admin/meus-pedidos/DevOrderCard.tsx`

Replace the credentials display (domainHost/User/Pass/Notes + security warning) with a single `domainName` display.

- [ ] **Step 1: Read the current file to find the domain section**

The domain section starts with `{showDomain && (order.domainHost || order.domainUser) && (` and contains the purple credentials block. Replace the entire domain section JSX with:

Find this block:
```tsx
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
```

Replace with:

```tsx
      {/* ── Domain Name (conditional) ── */}
      {showDomain && order.domainName && (
        <div className="border border-teal-500/20 bg-teal-500/5 rounded-xl p-3.5 space-y-1">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">Domínio do cliente</p>
          <p className="text-sm font-mono text-teal-300">{order.domainName}</p>
        </div>
      )}
```

- [ ] **Step 2: Remove unused imports**

In the imports at the top of `DevOrderCard.tsx`, remove `Lock` and `AlertTriangle` from the lucide-react import since they're no longer used.

The lucide-react import should become:

```tsx
import {
  ChevronDown, ChevronUp, ExternalLink, Loader2,
  Clock, CheckCircle2, Zap,
} from 'lucide-react'
```

- [ ] **Step 3: Verify TypeScript compiles with no errors**

```bash
cd "/c/Users/olive/OneDrive/Documentos/pessoal/cowly"
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/olive/OneDrive/Documentos/pessoal/cowly"
git add "app/(admin)/admin/meus-pedidos/DevOrderCard.tsx"
git commit -m "feat: update DevOrderCard to show domainName instead of credentials"
```
