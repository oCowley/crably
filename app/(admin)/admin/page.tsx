'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, TrendingUp, Users, Package, DollarSign, Loader2 } from 'lucide-react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { PROJECT_STATUS_LABELS, type ProjectStatus } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderDoc {
  id: string
  userId: string
  productId: string
  projectStatus: ProjectStatus
  price?: number
  productName?: string
  assignedDevId?: string
  createdAt: { toDate: () => Date } | Date | string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function toDate(v: OrderDoc['createdAt']): Date | null {
  if (!v) return null
  if (v instanceof Date) return v
  if (typeof v === 'object' && 'toDate' in v) return v.toDate()
  if (typeof v === 'string') return new Date(v)
  return null
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

// ─── Colors ───────────────────────────────────────────────────────────────────

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

// ─── Area chart ───────────────────────────────────────────────────────────────

function AreaChart({ data }: { data: { month: string; orders: number }[] }) {
  if (!data.length) return null
  const max = Math.max(...data.map((d) => d.orders), 1)
  const W = 300
  const H = 90
  const PAD = 10

  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - (d.orders / max) * (H - 12) - 4,
    val: d.orders,
    month: d.month,
  }))

  // Smooth cubic bezier path
  let linePath = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i].x + pts[i - 1].x) / 2
    linePath += ` C ${cpx} ${pts[i - 1].y}, ${cpx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`
  }

  const areaPath =
    linePath +
    ` L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" aria-label="Pedidos por mês">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF570E" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FF570E" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Horizontal guide lines */}
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={0} y1={H - t * (H - 12) - 4}
          x2={W} y2={H - t * (H - 12) - 4}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaFill)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="#FF570E"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points + labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#0d0d0d" stroke="#FF570E" strokeWidth="1.8" />
          <text x={p.x} y={H + 16} textAnchor="middle" fill="#525252" fontSize={9} fontFamily="system-ui">
            {p.month}
          </text>
          {p.val > 0 && (
            <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#FF570E" fontSize={9} fontFamily="system-ui" fontWeight="600">
              {p.val}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, Icon, iconBg, iconColor,
}: {
  label: string
  value: React.ReactNode
  Icon: React.ElementType
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="rounded-2xl bg-[#111111] border border-white/[0.06] p-5 flex flex-col gap-4 hover:border-white/[0.10] transition-colors">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-[11px] text-neutral-500 mt-1.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [activeProjects, setActiveProjects] = useState(0)
  const [monthly, setMonthly] = useState<{ month: string; orders: number }[]>([])
  const [statusDist, setStatusDist] = useState<{ status: ProjectStatus; count: number }[]>([])
  const [recent, setRecent] = useState<{
    id: string
    product: string
    customer: string
    status: ProjectStatus
    dev: string | null
    date: string
  }[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [ordersSnap, usersSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, 'orders')),
          getDocs(query(collection(db, 'users'), where('role', '==', 'customer'))),
          getDocs(collection(db, 'products')),
        ])

        const productMap: Record<string, string> = {}
        productsSnap.forEach((d) => { productMap[d.id] = (d.data() as { name: string }).name })

        const userMap: Record<string, string> = {}
        usersSnap.forEach((d) => {
          const u = d.data() as { name?: string; email?: string }
          userMap[d.id] = u.name || u.email || d.id
        })

        setTotalCustomers(usersSnap.size)

        const orders: OrderDoc[] = ordersSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<OrderDoc, 'id'>),
        }))

        setTotalOrders(orders.length)

        const productPriceMap: Record<string, number> = {}
        productsSnap.forEach((d) => { productPriceMap[d.id] = (d.data() as { price: number }).price })
        const rev = orders.reduce((sum, o) => sum + (o.price ?? productPriceMap[o.productId] ?? 0), 0)
        setTotalRevenue(rev)

        const active = orders.filter(
          (o) => !['completed', 'delivered', 'pending_payment'].includes(o.projectStatus),
        ).length
        setActiveProjects(active)

        const statusCount: Partial<Record<ProjectStatus, number>> = {}
        orders.forEach((o) => {
          statusCount[o.projectStatus] = (statusCount[o.projectStatus] ?? 0) + 1
        })
        const dist = (Object.entries(statusCount) as [ProjectStatus, number][])
          .map(([status, count]) => ({ status, count }))
          .sort((a, b) => b.count - a.count)
        setStatusDist(dist)

        const now = new Date()
        const months: { month: string; orders: number }[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          months.push({ month: PT_MONTHS[d.getMonth()], orders: 0 })
        }
        orders.forEach((o) => {
          const d = toDate(o.createdAt)
          if (!d) return
          for (let i = 5; i >= 0; i--) {
            const ref = new Date(now.getFullYear(), now.getMonth() - i, 1)
            if (d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()) {
              months[5 - i].orders += 1
              break
            }
          }
        })
        setMonthly(months)

        const sorted = [...orders]
          .sort((a, b) => {
            const da = toDate(a.createdAt)?.getTime() ?? 0
            const db_ = toDate(b.createdAt)?.getTime() ?? 0
            return db_ - da
          })
          .slice(0, 5)

        setRecent(
          sorted.map((o) => ({
            id: o.id,
            product: o.productName ?? productMap[o.productId] ?? o.productId,
            customer: userMap[o.userId] ?? o.userId,
            status: o.projectStatus,
            dev: o.assignedDevId ?? null,
            date: toDate(o.createdAt)?.toLocaleDateString('pt-BR') ?? '—',
          })),
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-neutral-600" />
      </div>
    )
  }

  const firstName = profile?.name?.split(' ')[0] ?? null
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const totalOrdersForPct = statusDist.reduce((s, d) => s + d.count, 0) || 1

  return (
    <div className="space-y-6">
      {/* Greeting header */}
      <div className="text-center py-4">
        <p className="text-[11px] font-medium text-neutral-600 uppercase tracking-widest capitalize">
          {today} · {greeting}{firstName ? `, ${firstName}` : ''} 👋
        </p>
        <h1 className="text-3xl lg:text-4xl font-bold text-white mt-2 tracking-tight">
          Visão geral da operação
        </h1>
        <div className="w-12 h-0.5 bg-brand rounded-full mx-auto mt-3" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Total de pedidos"
          value={totalOrders}
          Icon={Package}
          iconBg="bg-brand/15"
          iconColor="text-brand"
        />
        <StatCard
          label="Projetos ativos"
          value={activeProjects}
          Icon={TrendingUp}
          iconBg="bg-blue-500/15"
          iconColor="text-blue-400"
        />
        <StatCard
          label="Clientes cadastrados"
          value={totalCustomers}
          Icon={Users}
          iconBg="bg-purple-500/15"
          iconColor="text-purple-400"
        />
        <StatCard
          label="Receita total"
          value={(totalRevenue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          Icon={DollarSign}
          iconBg="bg-green-500/15"
          iconColor="text-green-400"
        />
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Recent orders — left, larger */}
        <div className="xl:col-span-3 rounded-2xl bg-[#111111] border border-white/[0.06] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-white">Pedidos recentes</h2>
              <p className="text-[11px] text-neutral-600 mt-0.5">Últimas 5 entradas</p>
            </div>
            <a
              href="/admin/pedidos"
              className="text-xs text-brand hover:text-brand-hover transition-colors flex items-center gap-1 shrink-0"
            >
              Ver todos <ArrowUpRight size={12} />
            </a>
          </div>

          {recent.length === 0 ? (
            <p className="text-xs text-neutral-600 px-5 py-8">Nenhum pedido encontrado.</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recent.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Customer initials avatar */}
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-neutral-400">
                      {initials(order.customer)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{order.product}</p>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">{order.customer}</p>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[order.status]}`}
                    >
                      {PROJECT_STATUS_LABELS[order.status]}
                    </span>
                    <span className="text-[10px] text-neutral-600">{order.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Charts — right column, stacked */}
        <div className="xl:col-span-2 flex flex-col gap-4">

          {/* Bar chart */}
          <div className="rounded-2xl bg-[#111111] border border-white/[0.06] p-5">
            <h2 className="text-sm font-semibold text-white">Pedidos por mês</h2>
            <p className="text-[11px] text-neutral-600 mt-0.5 mb-4">Últimos 6 meses</p>
            {monthly.every((m) => m.orders === 0) ? (
              <p className="text-xs text-neutral-600 py-6 text-center">Nenhum dado disponível.</p>
            ) : (
              <AreaChart data={monthly} />
            )}
          </div>

          {/* Status distribution */}
          <div className="flex-1 rounded-2xl bg-[#111111] border border-white/[0.06] p-5">
            <h2 className="text-sm font-semibold text-white">Status dos projetos</h2>
            <p className="text-[11px] text-neutral-600 mt-0.5 mb-5">Distribuição atual</p>
            {statusDist.length === 0 ? (
              <p className="text-xs text-neutral-600">Nenhum projeto encontrado.</p>
            ) : (
              <div className="space-y-3.5">
                {statusDist.map(({ status, count }) => {
                  const pct = Math.round((count / totalOrdersForPct) * 100)
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-neutral-400">{PROJECT_STATUS_LABELS[status]}</span>
                        <span className="text-xs font-semibold text-neutral-400">{count}</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${STATUS_BAR_COLORS[status]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
