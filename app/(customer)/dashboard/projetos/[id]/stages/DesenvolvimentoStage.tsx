'use client'

import type { DashboardOrder } from '@/types'
import { Zap, ExternalLink, Clock } from 'lucide-react'

const DEV_STEPS = [
  { key: 'design',    label: 'Design e wireframe' },
  { key: 'frontend',  label: 'Frontend' },
  { key: 'conteudo',  label: 'Conteúdo e copywriting' },
  { key: 'qa',        label: 'Revisão e testes' },
]

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

export default function DesenvolvimentoStage({ order }: { order: DashboardOrder; active: boolean; done: boolean }) {
  const devProgress: number = order.devProgress ?? 0

  const startDate = order.developmentStartedAt ?? new Date()
  const totalDays = order.prazo === '7dias' ? 7 : 14
  const deadline  = addBusinessDays(startDate, totalDays)
  const daysLeft  = Math.ceil((deadline.getTime() - Date.now()) / 86400000)

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-300">
        O desenvolvimento do seu projeto está em andamento. Acompanhe as etapas abaixo.
      </p>

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
