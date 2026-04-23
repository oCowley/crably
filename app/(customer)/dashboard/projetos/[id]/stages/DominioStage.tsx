'use client'

import { useState } from 'react'
import type { DashboardOrder } from '@/types'
import { Globe, Loader2, CheckCircle2, Lock } from 'lucide-react'

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors'

export default function DominioStage({ order }: { order: DashboardOrder; active: boolean; done: boolean }) {
  const [host, setHost]     = useState('')
  const [user, setUser]     = useState('')
  const [pass, setPass]     = useState('')
  const [notes, setNotes]   = useState('')
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
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="Ex: registro.br, GoDaddy, Hostinger"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-400">Usuário / E-mail</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="usuario@email.com"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-400">Senha</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">Observações (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ex: domínio é meusite.com.br"
            className={`${inputCls} resize-none`}
          />
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
