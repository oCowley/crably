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
