'use client'

import { useState } from 'react'
import type { DashboardOrder } from '@/types'
import { Globe, Loader2, CheckCircle2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

const DNS_RECORDS = [
  { type: 'A',     name: '@',   value: '76.76.21.21',         ttl: 'Auto' },
  { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com', ttl: 'Auto' },
]

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-elevated border border-border-strong rounded-xl text-foreground placeholder:text-faint focus:outline-none focus:border-brand/50 transition-colors'

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
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // clipboard unavailable (HTTP or permissions denied) — silently ignore
    }
  }

  async function handleSubmit() {
    if (!domainName.trim() || !confirmed) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projetos/${order.id}/domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainName: domainName.trim() }),
      })
      if (res.ok) setSaved(true)
    } catch {
      // network error — user can retry
    } finally {
      setSaving(false)
    }
  }

  if (isConfirmed) {
    const name = order.domainName ?? domainName
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
        <CheckCircle2 size={16} className="text-teal-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Domínio recebido!</p>
          {name && (
            <p className="text-xs text-teal-400 font-mono mt-0.5">{name}</p>
          )}
          <p className="text-xs text-secondary mt-1">
            Nossa equipe vai conectar seu domínio ao site em breve.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-secondary leading-relaxed">
        Para conectar seu domínio ao site, você precisa adicionar dois registros DNS
        no painel da sua registradora (onde você comprou o domínio).
      </p>

      {/* Domain input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-secondary">Seu domínio</label>
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
        <p className="text-xs font-semibold text-secondary">Registros DNS para adicionar</p>
        <div className="rounded-xl border border-border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[60px_60px_1fr_60px_36px] gap-2 px-3 py-2 bg-surface border-b border-border">
            {['Tipo', 'Nome', 'Valor', 'TTL', ''].map((h) => (
              <span key={h} className="text-[10px] font-semibold text-faint uppercase tracking-wide">{h}</span>
            ))}
          </div>
          {/* Rows */}
          {DNS_RECORDS.map((rec) => (
            <div
              key={rec.type}
              className="grid grid-cols-[60px_60px_1fr_60px_36px] gap-2 items-center px-3 py-2.5 border-b border-border last:border-0"
            >
              <span className="text-xs font-mono font-bold text-brand">{rec.type}</span>
              <span className="text-xs font-mono text-secondary">{rec.name}</span>
              <span className="text-xs font-mono text-foreground truncate">{rec.value}</span>
              <span className="text-xs text-muted">{rec.ttl}</span>
              <button
                onClick={() => handleCopy(rec.value)}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-elevated text-muted hover:text-foreground transition-colors"
                title={`Copiar ${rec.value}`}
              >
                {copied === rec.value
                  ? <Check size={12} className="text-success" />
                  : <Copy size={12} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tutorial collapsible */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setTutorial(o => !o)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-secondary hover:text-foreground hover:bg-elevated transition-colors"
        >
          Como fazer isso?
          {tutorialOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {tutorialOpen && (
          <div className="px-3.5 pb-4 pt-3 border-t border-border space-y-2.5">
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
                <p className="text-xs text-secondary leading-relaxed">{step}</p>
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
            confirmed ? 'bg-brand border-brand' : 'border-border-strong bg-elevated group-hover:border-border-strong'
          }`}>
            {confirmed && <Check size={10} className="text-white" strokeWidth={3} />}
          </div>
        </div>
        <span className="text-xs text-secondary transition-colors leading-relaxed">
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
