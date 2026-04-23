'use client'

import { useState } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DashboardOrder, ProjectStage } from '@/types'
import {
  ChevronDown, ChevronUp, ExternalLink, Loader2,
  Clock, CheckCircle2, Zap,
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
              disabled={savingStep !== null}
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

      {/* ── Domain Name (conditional) ── */}
      {showDomain && order.domainName && (
        <div className="border border-teal-500/20 bg-teal-500/5 rounded-xl p-3.5 space-y-1">
          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">Domínio do cliente</p>
          <p className="text-sm font-mono text-teal-300">{order.domainName}</p>
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
