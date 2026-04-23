'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import {
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Clock,
  Calendar,
  Zap,
  CheckCircle2,
  Circle,
  Loader2,
  Eye,
  FileText,
  Link2,
} from 'lucide-react'
import type { DashboardOrder, ProjectStage } from '@/types'
import { PROJECT_STAGE_LABELS } from '@/types'

const STATUS_ORDER: ProjectStage[] = [
  'briefing',
  'agendamento',
  'meet_confirmado',
  'em_desenvolvimento',
  'em_revisao',
  'aguardando_dominio',
  'entregue',
]

const STATUS_CONFIG: Record<
  ProjectStage,
  { color: string; bg: string; border: string; icon: React.ReactNode; label: string }
> = {
  pending_payment: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: <Loader2 size={13} className="animate-spin" />,
    label: 'Processando pagamento…',
  },
  briefing: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: <FileText size={13} />,
    label: 'Briefing pendente',
  },
  agendamento: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: <Calendar size={13} />,
    label: 'Agendar meet',
  },
  meet_confirmado: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: <Clock size={13} />,
    label: 'Meet agendado',
  },
  em_desenvolvimento: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: <Zap size={13} />,
    label: 'Em desenvolvimento',
  },
  em_revisao: {
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: <Eye size={13} />,
    label: 'Em revisão',
  },
  aguardando_dominio: {
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    icon: <Link2 size={13} />,
    label: 'Conexão de domínio',
  },
  entregue: {
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: <CheckCircle2 size={13} />,
    label: 'Entregue',
  },
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDeadline(createdAt: Date, prazo: '14dias' | '7dias') {
  const days = prazo === '7dias' ? 7 : 14
  const deadline = new Date(createdAt)
  deadline.setDate(deadline.getDate() + days)
  return deadline
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function getDaysRemaining(deadline: Date): { days: number; urgent: boolean; overdue: boolean } {
  const now = new Date()
  const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return { days: diff, urgent: diff <= 3 && diff >= 0, overdue: diff < 0 }
}

function getProgressPercent(stage: ProjectStage): number {
  const map: Record<ProjectStage, number> = {
    pending_payment: 0,
    briefing: 10,
    agendamento: 20,
    meet_confirmado: 30,
    em_desenvolvimento: 55,
    em_revisao: 75,
    aguardando_dominio: 88,
    entregue: 100,
  }
  return map[stage]
}

async function confirmSession(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/checkout/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
    const data = (await res.json()) as { status?: string }
    return data.status === 'confirmed'
  } catch {
    return false
  }
}

function StatusTimeline({ stage }: { stage: ProjectStage }) {
  if (stage === 'pending_payment') return null
  const currentIndex = STATUS_ORDER.indexOf(stage)

  return (
    <div className="flex items-center gap-0 mt-4">
      {STATUS_ORDER.map((s, i) => {
        const cfg = STATUS_CONFIG[s]
        const done = i < currentIndex
        const active = i === currentIndex
        const future = i > currentIndex

        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 text-[10px]
                  ${done ? 'bg-brand text-white' : active ? `${cfg.bg} ${cfg.border} border ${cfg.color}` : 'bg-white/5 border border-white/10 text-neutral-600'}
                `}
              >
                {done ? (
                  <CheckCircle2 size={12} />
                ) : active ? (
                  cfg.icon
                ) : (
                  <Circle size={10} />
                )}
              </div>
              <span
                className={`text-[9px] font-medium whitespace-nowrap ${
                  done ? 'text-brand' : active ? cfg.color : 'text-neutral-600'
                }`}
              >
                {PROJECT_STAGE_LABELS[s]}
              </span>
            </div>
            {i < STATUS_ORDER.length - 1 && (
              <div className="flex-1 h-px mx-1 mb-4" style={{
                background: done
                  ? 'linear-gradient(90deg, #F97316, #F97316)'
                  : 'rgba(255,255,255,0.06)',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ProjetosPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<DashboardOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') !== 'true') return

    const sessionId = params.get('session_id')
    setShowSuccess(true)
    window.history.replaceState({}, '', window.location.pathname)

    if (sessionId) {
      confirmSession(sessionId)
    }

    const t = setTimeout(() => setShowSuccess(false), 6000)
    return () => clearTimeout(t)
  }, [])

  const uid = user?.uid

  useEffect(() => {
    if (!uid) return

    const q = query(collection(db, 'orders'), where('userId', '==', uid))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rows: DashboardOrder[] = snapshot.docs
          .filter((d) => d.data().productName !== undefined)
          .map((docSnap) => {
            const data = docSnap.data()
            const createdAtRaw = data.createdAt
            return {
              id: docSnap.id,
              userId: data.userId as string,
              assignedDevId: (data.assignedDevId as string | null) ?? null,
              productName: data.productName as string,
              productType: (data.productType as string) || '',
              projectName: (data.projectName as string) || '',
              briefing: (data.briefing as string) || '',
              reference: (data.reference as string) || '',
              prazo: (data.prazo as '14dias' | '7dias') || '14dias',
              price: (data.price as number) || 0,
              projectStage: (data.projectStage as ProjectStage) ?? 'briefing',
              deployUrl: (data.deployUrl as string | null) ?? null,
              meetLink: (data.meetLink as string | null) ?? null,
              meetDate: (data.meetDate as string | null) ?? null,
              revisionPaid: (data.revisionPaid as boolean) ?? false,
              devProgress: (data.devProgress as number) ?? 0,
              developmentStartedAt: null,
              stripeSessionId: (data.stripeSessionId as string) || '',
              deliveryUrl: (data.deliveryUrl as string | null) ?? null,
              createdAt:
                createdAtRaw instanceof Timestamp
                  ? createdAtRaw.toDate()
                  : new Date(),
            }
          })

        rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        setOrders(rows)
        setLoading(false)
      },
      (err) => {
        console.error('[projetos] Firestore listener error', err)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [uid])

  async function handleVerifyOrder(order: DashboardOrder) {
    if (!order.stripeSessionId) return
    setVerifying(order.id)
    await confirmSession(order.stripeSessionId)
    setTimeout(() => setVerifying(null), 1500)
  }

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-7 w-40 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-white/5 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-[#111111] rounded-2xl border border-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const pendingOrders = orders.filter((o) => o.projectStage === 'pending_payment')
  const activeOrders  = orders.filter((o) => o.projectStage !== 'pending_payment')

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Meus projetos</h1>
        <p className="text-neutral-500 mt-1 text-sm">
          Acompanhe o andamento dos seus pedidos em tempo real
        </p>
      </div>

      {/* Banner pagamento confirmado */}
      {showSuccess && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-green-500/10 border border-green-500/25">
          <span className="text-green-400 text-lg leading-none mt-0.5">✓</span>
          <div>
            <p className="text-sm font-semibold text-green-400">Pagamento confirmado!</p>
            <p className="text-xs text-green-400/70 mt-0.5">
              Seu projeto foi criado e nossa equipe já foi notificada.
            </p>
          </div>
        </div>
      )}

      {/* Pendentes */}
      {pendingOrders.length > 0 && (
        <div className="mb-6 space-y-3">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-medium">
            Aguardando confirmação de pagamento
          </p>
          {pendingOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 bg-[#111111] rounded-2xl border border-yellow-500/15 flex items-center gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{order.productName}</span>
                  {order.projectName && (
                    <span className="text-sm text-neutral-500">— {order.projectName}</span>
                  )}
                </div>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Se você já concluiu o pagamento, clique em verificar.
                </p>
              </div>
              <span className="text-sm font-bold text-yellow-400 shrink-0">
                {formatPrice(order.price)}
              </span>
              {order.stripeSessionId && (
                <button
                  onClick={() => handleVerifyOrder(order)}
                  disabled={verifying === order.id}
                  className="shrink-0 h-8 px-3 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                >
                  <RefreshCw size={12} className={verifying === order.id ? 'animate-spin' : ''} />
                  Verificar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {activeOrders.length === 0 && pendingOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[#111111] rounded-2xl border border-white/5 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
            <ShoppingBag size={24} className="text-neutral-600" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Você ainda não tem projetos</h2>
          <p className="text-sm text-neutral-400 mb-6 max-w-xs">Que tal contratar o primeiro?</p>
          <Link
            href="/dashboard/contratar"
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors"
          >
            Contratar site →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activeOrders.map((order) => {
            const cfg = STATUS_CONFIG[order.projectStage]
            const deadline = formatDeadline(order.createdAt, order.prazo)
            const { days, urgent, overdue } = getDaysRemaining(deadline)
            const progress = getProgressPercent(order.projectStage)
            const isDelivered = order.projectStage === 'entregue'

            return (
              <div
                key={order.id}
                className={`relative overflow-hidden bg-[#111111] rounded-2xl border transition-all duration-300 hover:border-white/10 ${cfg.border}`}
                style={{ boxShadow: `0 4px 24px ${isDelivered ? 'rgba(34,197,94,0.06)' : 'rgba(0,0,0,0.3)'}` }}
              >
                {/* Progress bar top */}
                <div className="h-0.5 w-full bg-white/5">
                  <div
                    className="h-full transition-all duration-700 rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: isDelivered
                        ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                        : 'linear-gradient(90deg, #F97316, #fb923c)',
                    }}
                  />
                </div>

                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      {/* Title + badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-base">{order.productName}</h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.color}`}
                        >
                          {cfg.icon}
                          {PROJECT_STAGE_LABELS[order.projectStage]}
                        </span>
                        {order.prazo === '7dias' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-brand/10 border-brand/20 text-brand">
                            <Zap size={9} />
                            EXPRESS
                          </span>
                        )}
                      </div>

                      {/* Project name */}
                      {order.projectName && (
                        <p className="text-sm font-semibold text-neutral-300 mt-1">
                          {order.projectName}
                        </p>
                      )}
                    </div>

                    {/* Price + action */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-xl font-bold ${isDelivered ? 'text-green-400' : 'text-brand'}`}>
                        {formatPrice(order.price)}
                      </span>
                      <Link
                        href={`/dashboard/projetos/${order.id}`}
                        className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
                      >
                        Ver projeto <ExternalLink size={12} />
                      </Link>
                      {isDelivered && order.deliveryUrl && (
                        <a
                          href={order.deliveryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/20 transition-colors"
                        >
                          Ver site <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Briefing */}
                  {order.briefing && (
                    <p className="text-sm text-neutral-500 mt-3 line-clamp-2 leading-relaxed">
                      {order.briefing}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="mt-4 flex items-center flex-wrap gap-x-4 gap-y-2">
                    {/* Data do pedido */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                      <Calendar size={11} />
                      <span>Pedido em {formatDate(order.createdAt)}</span>
                    </div>

                    {/* Prazo */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                      <Clock size={11} />
                      <span>{order.prazo === '7dias' ? '7 dias express' : '14 dias'}</span>
                    </div>

                    {/* Contagem regressiva */}
                    {!isDelivered && (
                      <div
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md ${
                          overdue
                            ? 'text-red-400 bg-red-500/10'
                            : urgent
                              ? 'text-orange-400 bg-orange-500/10'
                              : 'text-neutral-500 bg-white/5'
                        }`}
                      >
                        <Clock size={10} />
                        {overdue
                          ? `${Math.abs(days)}d em atraso`
                          : days === 0
                            ? 'Entrega hoje'
                            : `${days}d restantes`}
                      </div>
                    )}

                    {/* Previsão entrega */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                      <CheckCircle2 size={11} />
                      <span>
                        {isDelivered ? 'Entregue em' : 'Previsão:'} {formatDate(deadline)}
                      </span>
                    </div>

                    {/* Referência */}
                    {order.reference && (
                      <a
                        href={order.reference}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-300 transition-colors"
                      >
                        <Link2 size={11} />
                        <span className="underline underline-offset-2 truncate max-w-[160px]">
                          Referência
                        </span>
                      </a>
                    )}

                    {/* Briefing icon */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600" title={order.briefing}>
                      <FileText size={11} />
                      <span>{order.briefing.length} caracteres de briefing</span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <StatusTimeline stage={order.projectStage} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
