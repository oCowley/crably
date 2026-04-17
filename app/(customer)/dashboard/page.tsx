'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { PROJECT_STATUS_LABELS, type ProjectStatus, type Product } from '@/types'

const STATUS_COLORS: Record<ProjectStatus, string> = {
  pending_payment: 'text-yellow-400 bg-yellow-400/10',
  paid: 'text-blue-400 bg-blue-400/10',
  queued: 'text-neutral-400 bg-neutral-400/10',
  assigned: 'text-purple-400 bg-purple-400/10',
  in_progress: 'text-blue-400 bg-blue-400/10',
  review: 'text-orange-400 bg-orange-400/10',
  delivered: 'text-brand bg-brand/10',
  completed: 'text-green-400 bg-green-400/10',
}

type OrderRow = {
  id: string
  productName: string
  projectStatus: ProjectStatus
  createdAt: Date
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchOrders() {
      try {
        const q = query(collection(db, 'orders'), where('userId', '==', user!.uid))
        const snapshot = await getDocs(q)

        const rows = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data()
            const productDoc = await getDoc(doc(db, 'products', data.productId))
            const productName = productDoc.exists()
              ? (productDoc.data() as Product).name
              : 'Produto desconhecido'
            const createdAt =
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(data.createdAt)
            return {
              id: docSnap.id,
              productName,
              projectStatus: data.projectStatus as ProjectStatus,
              createdAt,
            }
          })
        )

        rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        setOrders(rows)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  if (loading) {
    return (
      <div>
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Meus Pedidos</h1>
          <p className="text-neutral-400">Acompanhe seus projetos do pagamento até a entrega.</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-dark-card rounded-2xl border border-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Meus Pedidos</h1>
        <p className="text-neutral-400">Acompanhe seus projetos do pagamento até a entrega.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24 bg-dark-card rounded-2xl border border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Nenhum pedido ainda</h2>
          <p className="text-sm text-neutral-400 mb-6">Explore nossos templates e comece o seu site.</p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center h-10 px-6 text-sm font-semibold rounded-xl bg-brand text-white hover:bg-brand-hover transition-colors"
          >
            Ver templates
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block p-6 bg-dark-card rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-brand transition-colors">
                    {order.productName}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Order #{order.id} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.projectStatus]}`}>
                    {PROJECT_STATUS_LABELS[order.projectStatus]}
                  </span>
                  <svg className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
