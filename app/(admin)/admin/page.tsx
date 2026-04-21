'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, TrendingUp, Users, Package, DollarSign, Loader2 } from 'lucide-react'
import { collection, getDocs, orderBy, query, limit, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
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

// ─── Bar chart ────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { month: string; orders: number }[] }) {
  if (!data.length) return null
  const max = Math.max(...data.map((d) => d.orders), 1)
  const W = 360
  const H = 100
  const barW = 36
  const n = data.length
  const gap = (W - n * barW) / (n + 1)

  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" aria-label="Pedidos por mês">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={0} y1={H - t * H}
          x2={W} y2={H - t * H}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
        />
      ))}

      {data.map((d, i) => {
        const barH = Math.max((d.orders / max) * H, d.orders > 0 ? 4 : 0)
        const x = gap + i * (barW + gap)
        const y = H - barH
        return (
          <g key={d.month}>
            <rect x={x} y={y} width={barW} height={barH} rx={5} fill="url(#barGrad)" />
            <text x={x + barW / 2} y={H + 20} textAnchor="middle" fill="#6b7280" fontSize={10} fontFamily="system-ui, sans-serif">
              {d.month}
            </text>
            {d.orders > 0 && (
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="#F97316" fontSize={9} fontFamily="system-ui, sans-serif" fontWeight="600">
                {d.orders}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
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

        // lookup maps
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

        // revenue — use price field if present, otherwise fall back to product price
        const productPriceMap: Record<string, number> = {}
        productsSnap.forEach((d) => { productPriceMap[d.id] = (d.data() as { price: number }).price })
        const rev = orders.reduce((sum, o) => {
          const price = o.price ?? productPriceMap[o.productId] ?? 0
          return sum + price
        }, 0)
        setTotalRevenue(rev)

        // active projects
        const active = orders.filter(
          (o) => !['completed', 'delivered', 'pending_payment'].includes(o.projectStatus),
        ).length
        setActiveProjects(active)

        // status distribution
        const statusCount: Partial<Record<ProjectStatus, number>> = {}
        orders.forEach((o) => {
          statusCount[o.projectStatus] = (statusCount[o.projectStatus] ?? 0) + 1
        })
        const dist = (Object.entries(statusCount) as [ProjectStatus, number][])
          .map(([status, count]) => ({ status, count }))
          .sort((a, b) => b.count - a.count)
        setStatusDist(dist)

        // monthly — last 6 months
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

        // recent orders — latest 5 sorted by createdAt
        const sorted = [...orders].sort((a, b) => {
          const da = toDate(a.createdAt)?.getTime() ?? 0
          const db_ = toDate(b.createdAt)?.getTime() ?? 0
          return db_ - da
        }).slice(0, 5)

        setRecent(sorted.map((o) => ({
          id: o.id,
          product: o.productName ?? productMap[o.productId] ?? o.productId,
          customer: userMap[o.userId] ?? o.userId,
          status: o.projectStatus,
          dev: o.assignedDevId ?? null,
          date: toDate(o.createdAt)?.toLocaleDateString('pt-BR') ?? '—',
        })))
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

  const totalOrdersForPct = statusDist.reduce((s, d) => s + d.count, 0) || 1

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-neutral-500 text-sm">Visão geral da operação Crably.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total de pedidos', value: totalOrders, icon: Package, color: 'text-brand' },
          { label: 'Projetos ativos', value: activeProjects, icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Clientes cadastrados', value: totalCustomers, icon: Users, color: 'text-purple-400' },
          {
            label: 'Receita total',
            value: (totalRevenue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            icon: DollarSign,
            color: 'text-green-400',
          },
        ].map((s) => (
          <div key={s.label} className="bento-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">{s.label}</span>
              <div className={`p-1.5 rounded-lg bg-white/5 ${s.color}`}>
                <s.icon size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="xl:col-span-2 bento-card p-6">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-white">Pedidos por mês</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Últimos 6 meses</p>
          </div>
          {monthly.every((m) => m.orders === 0) ? (
            <p className="text-xs text-neutral-600 text-center py-8">Nenhum pedido registrado ainda.</p>
          ) : (
            <BarChart data={monthly} />
          )}
        </div>

        {/* Status distribution */}
        <div className="bento-card p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Status dos projetos</h2>
          <p className="text-xs text-neutral-500 mb-6">Distribuição atual</p>
          {statusDist.length === 0 ? (
            <p className="text-xs text-neutral-600">Nenhum projeto encontrado.</p>
          ) : (
            <div className="space-y-3">
              {statusDist.map(({ status, count }) => {
                const pct = Math.round((count / totalOrdersForPct) * 100)
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neutral-400">{PROJECT_STATUS_LABELS[status]}</span>
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
          )}
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
        {recent.length === 0 ? (
          <p className="text-xs text-neutral-600 px-6 py-8">Nenhum pedido encontrado.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {recent.map((order) => (
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
        )}
      </div>
    </div>
  )
}
