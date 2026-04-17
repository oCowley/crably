import type { Metadata } from 'next'
import { ArrowUpRight, TrendingUp, Users, Package, DollarSign } from 'lucide-react'
import { PROJECT_STATUS_LABELS, type ProjectStatus } from '@/types'

export const metadata: Metadata = { title: 'Admin — Dashboard' }

/* ─── Static placeholder data ─────────────────────────────── */

const MONTHLY = [
  { month: 'Nov', orders: 3, revenue: 4200 },
  { month: 'Dez', orders: 5, revenue: 7500 },
  { month: 'Jan', orders: 4, revenue: 5800 },
  { month: 'Fev', orders: 7, revenue: 10200 },
  { month: 'Mar', orders: 6, revenue: 8900 },
  { month: 'Abr', orders: 9, revenue: 13500 },
]

const STATUS_DIST: { status: ProjectStatus; count: number }[] = [
  { status: 'in_progress', count: 4 },
  { status: 'review', count: 2 },
  { status: 'queued', count: 3 },
  { status: 'completed', count: 8 },
  { status: 'assigned', count: 2 },
  { status: 'delivered', count: 1 },
]

const RECENT = [
  { id: 'ord_001', customer: 'Alice Mendes', product: 'Agency Pro', status: 'in_progress' as ProjectStatus, dev: 'João', date: '2026-04-10' },
  { id: 'ord_002', customer: 'Bruno Costa', product: 'SaaS Launch', status: 'review' as ProjectStatus, dev: 'Maria', date: '2026-04-09' },
  { id: 'ord_003', customer: 'Carla Nunes', product: 'Local Business', status: 'queued' as ProjectStatus, dev: null, date: '2026-04-07' },
  { id: 'ord_004', customer: 'Daniel Lima', product: 'Portfolio Studio', status: 'completed' as ProjectStatus, dev: 'João', date: '2026-04-05' },
  { id: 'ord_005', customer: 'Eva Rocha', product: 'Agency Pro', status: 'assigned' as ProjectStatus, dev: 'Pedro', date: '2026-04-04' },
]

const STATUS_COLORS: Record<ProjectStatus, string> = {
  pending_payment: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  paid: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  queued: 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20',
  assigned: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  in_progress: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  review: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  delivered: 'text-brand bg-brand/10 border-brand/20',
  completed: 'text-green-400 bg-green-400/10 border-green-400/20',
}

const STATUS_BAR_COLORS: Record<ProjectStatus, string> = {
  pending_payment: 'bg-yellow-400',
  paid: 'bg-blue-400',
  queued: 'bg-neutral-500',
  assigned: 'bg-purple-400',
  in_progress: 'bg-blue-400',
  review: 'bg-orange-400',
  delivered: 'bg-brand',
  completed: 'bg-green-400',
}

/* ─── Bar chart (SVG) ──────────────────────────────────────── */

function BarChart() {
  const max = Math.max(...MONTHLY.map((d) => d.orders))
  const W = 360
  const H = 100
  const barW = 36
  const n = MONTHLY.length
  const gap = (W - n * barW) / (n + 1)

  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" aria-label="Pedidos por mês">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={0} y1={H - t * H}
          x2={W} y2={H - t * H}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
        />
      ))}

      {MONTHLY.map((d, i) => {
        const barH = (d.orders / max) * H
        const x = gap + i * (barW + gap)
        const y = H - barH
        return (
          <g key={d.month}>
            <rect x={x} y={y} width={barW} height={barH} rx={5} fill="url(#barGrad)" />
            <text
              x={x + barW / 2}
              y={H + 20}
              textAnchor="middle"
              fill="#6b7280"
              fontSize={10}
              fontFamily="system-ui, sans-serif"
            >
              {d.month}
            </text>
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              fill="#F97316"
              fontSize={9}
              fontFamily="system-ui, sans-serif"
              fontWeight="600"
            >
              {d.orders}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ─── Page ─────────────────────────────────────────────────── */

export default function DashboardPage() {
  const totalRevenue = MONTHLY.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = STATUS_DIST.reduce((s, d) => s + d.count, 0)
  const activeProjects = STATUS_DIST
    .filter((d) => !['completed', 'delivered'].includes(d.status))
    .reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-neutral-500 text-sm">Visão geral da operação Cowly.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Total de pedidos',
            value: totalOrders,
            icon: Package,
            trend: '+12%',
            color: 'text-brand',
          },
          {
            label: 'Projetos ativos',
            value: activeProjects,
            icon: TrendingUp,
            trend: '+3',
            color: 'text-blue-400',
          },
          {
            label: 'Clientes cadastrados',
            value: 34,
            icon: Users,
            trend: '+8%',
            color: 'text-purple-400',
          },
          {
            label: 'Receita total',
            value: `R$ ${(totalRevenue / 1000).toFixed(1)}k`,
            icon: DollarSign,
            trend: '+21%',
            color: 'text-green-400',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bento-card p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">{s.label}</span>
              <div className={`p-1.5 rounded-lg bg-white/5 ${s.color}`}>
                <s.icon size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <div className="flex items-center gap-1 text-xs text-green-400">
              <ArrowUpRight size={12} />
              <span>{s.trend} este mês</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="xl:col-span-2 bento-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white">Pedidos por mês</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Últimos 6 meses</p>
            </div>
            <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-full">
              +50% vs período anterior
            </span>
          </div>
          <BarChart />
        </div>

        {/* Status distribution */}
        <div className="bento-card p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Status dos projetos</h2>
          <p className="text-xs text-neutral-500 mb-6">Distribuição atual</p>
          <div className="space-y-3">
            {STATUS_DIST.map(({ status, count }) => {
              const pct = Math.round((count / totalOrders) * 100)
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-neutral-400">
                      {PROJECT_STATUS_LABELS[status]}
                    </span>
                    <span className="text-xs text-neutral-500">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${STATUS_BAR_COLORS[status]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bento-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Pedidos recentes</h2>
          <a
            href="/admin/pedidos"
            className="text-xs text-brand hover:text-brand-hover transition-colors flex items-center gap-1"
          >
            Ver todos <ArrowUpRight size={12} />
          </a>
        </div>
        <div className="divide-y divide-white/5">
          {RECENT.map((order) => (
            <div
              key={order.id}
              className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{order.product}</p>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">{order.customer}</p>
              </div>
              <span className="text-xs text-neutral-600 hidden sm:block">{order.date}</span>
              <span className="text-sm text-neutral-400 hidden md:block w-20 text-right truncate">
                {order.dev ?? <span className="text-neutral-600 italic">Sem dev</span>}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${STATUS_COLORS[order.status]}`}
              >
                {PROJECT_STATUS_LABELS[order.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
