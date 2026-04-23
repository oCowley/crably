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
