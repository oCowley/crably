'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { Search, Users } from 'lucide-react'
import { db } from '@/lib/firebase'
import type { UserProfile, Product, Order } from '@/types'

type ClientRow = {
  id: string
  name: string
  email: string
  createdAt: Date
  orders: number
  totalSpent: number
  lastOrder: Date | null
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(value as string)
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0">
      <span className="text-xs font-semibold text-brand">{initials}</span>
    </div>
  )
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersSnap, ordersSnap, productsSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'customer'))),
          getDocs(query(collection(db, 'orders'), where('paymentStatus', '==', 'paid'))),
          getDocs(collection(db, 'products')),
        ])

        const priceMap = new Map<string, number>()
        productsSnap.docs.forEach((d) => {
          priceMap.set(d.id, (d.data() as Product).price)
        })

        const paidOrders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))

        const rows: ClientRow[] = usersSnap.docs.map((d) => {
          const user = { id: d.id, ...d.data() } as UserProfile
          const userOrders = paidOrders.filter((o) => o.userId === user.id)
          const totalSpent = userOrders.reduce((sum, o) => sum + (priceMap.get(o.productId) ?? 0), 0)
          const dates = userOrders
            .map((o) => toDate(o.createdAt))
            .sort((a, b) => b.getTime() - a.getTime())

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: toDate(user.createdAt),
            orders: userOrders.length,
            totalSpent,
            lastOrder: dates[0] ?? null,
          }
        })

        rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        setClientes(rows)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filtered = search
    ? clientes.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase())
      )
    : clientes

  const totalSpent = clientes.reduce((s, c) => s + c.totalSpent, 0)
  const comPedidos = clientes.filter((c) => c.orders > 0).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Clientes</h1>
          <p className="text-neutral-500 text-sm">Histórico e informações dos clientes cadastrados.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de clientes', value: loading ? '—' : clientes.length },
          { label: 'Com pedidos', value: loading ? '—' : comPedidos },
          {
            label: 'Receita gerada',
            value: loading ? '—' : `R$ ${(totalSpent / 1000).toFixed(1)}k`,
          },
          {
            label: 'Ticket médio',
            value:
              loading || comPedidos === 0
                ? '—'
                : `R$ ${Math.round(totalSpent / comPedidos).toLocaleString('pt-BR')}`,
          },
        ].map((s) => (
          <div key={s.label} className="bento-card p-5">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bento-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-sm font-semibold text-white flex-1">Todos os clientes</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="search"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/40 w-full sm:w-48"
            />
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-white/5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-6 py-4 h-14 animate-pulse bg-white/[0.02]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={32} className="text-neutral-700 mb-3" />
            <p className="text-sm text-neutral-500">
              {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Cliente', 'Email', 'Cadastro', 'Pedidos', 'Total gasto', 'Último pedido'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-neutral-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} />
                          <span className="font-medium text-white text-sm">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-400">{c.email}</td>
                      <td className="px-6 py-4 text-xs text-neutral-500">{formatDate(c.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-neutral-300 text-center">{c.orders}</td>
                      <td className="px-6 py-4 text-sm text-neutral-300">
                        {c.totalSpent > 0
                          ? `R$ ${c.totalSpent.toLocaleString('pt-BR')}`
                          : <span className="text-neutral-600">—</span>}
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-500">
                        {c.lastOrder ? formatDate(c.lastOrder) : <span className="text-neutral-700">Sem pedidos</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-white/5">
              {filtered.map((c) => (
                <div key={c.id} className="px-5 py-4 flex items-center gap-3">
                  <Avatar name={c.name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{c.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{c.email}</p>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      {c.orders} {c.orders === 1 ? 'pedido' : 'pedidos'} ·{' '}
                      {c.totalSpent > 0 ? `R$ ${c.totalSpent.toLocaleString('pt-BR')}` : 'Sem compras'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
