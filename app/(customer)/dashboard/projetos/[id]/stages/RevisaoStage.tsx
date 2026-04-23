'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { DashboardOrder } from '@/types'
import { RefreshCw, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'

export default function RevisaoStage({ order }: { order: DashboardOrder; active: boolean; done: boolean }) {
  const [loading, setLoading]   = useState(false)
  const searchParams            = useSearchParams()
  const revisaoPaga             = searchParams.get('revisao') === 'paga'

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

      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={handleRequestRevision}
          disabled={loading}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          {loading ? 'Redirecionando…' : 'Solicitar revisão'}
        </button>
        <p className="text-xs text-neutral-600">
          Ou pule esta etapa — seu projeto avança para conexão de domínio.
        </p>
      </div>
    </div>
  )
}
