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
      <p className="text-sm text-neutral-300 leading-relaxed">
        Antes de começar, queremos entender melhor seu projeto.
        O briefing preenchido na compra já foi recebido — use este espaço para adicionar detalhes extras e referências visuais.
      </p>

      {order.briefing && (
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8">
          <p className="text-xs font-medium text-neutral-500 mb-1.5">Briefing enviado na compra</p>
          <p className="text-sm text-neutral-300 leading-relaxed">{order.briefing}</p>
        </div>
      )}

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
