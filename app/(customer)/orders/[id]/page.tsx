'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { PROJECT_STATUS_LABELS, type ProjectStatus, type Product } from '@/types'

const ALL_STATUSES: ProjectStatus[] = [
  'paid',
  'queued',
  'assigned',
  'in_progress',
  'review',
  'delivered',
  'completed',
]

type Update = { status: ProjectStatus; note: string; createdAt: Date }

type OrderData = {
  id: string
  productName: string
  projectStatus: ProjectStatus
  createdAt: Date
  updates: Update[]
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!user) return

    async function fetchOrder() {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', id))

        if (!orderDoc.exists() || orderDoc.data().userId !== user!.uid) {
          setNotFound(true)
          return
        }

        const data = orderDoc.data()

        const productDoc = await getDoc(doc(db, 'products', data.productId))
        const productName = productDoc.exists()
          ? (productDoc.data() as Product).name
          : 'Produto desconhecido'

        const updatesSnap = await getDocs(
          query(
            collection(db, 'projectUpdates'),
            where('orderId', '==', id),
            orderBy('createdAt', 'asc')
          )
        )

        const updates: Update[] = updatesSnap.docs.map((d) => {
          const u = d.data()
          return {
            status: u.status as ProjectStatus,
            note: u.note as string,
            createdAt: u.createdAt instanceof Timestamp ? u.createdAt.toDate() : new Date(u.createdAt),
          }
        })

        setOrder({
          id,
          productName,
          projectStatus: data.projectStatus as ProjectStatus,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updates,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [user, id])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-dark-card rounded-2xl border border-white/5 animate-pulse" />
        <div className="h-48 bg-dark-card rounded-2xl border border-white/5 animate-pulse" />
        <div className="h-64 bg-dark-card rounded-2xl border border-white/5 animate-pulse" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="text-center py-24">
        <p className="text-lg font-semibold text-white mb-2">Pedido não encontrado</p>
        <p className="text-sm text-neutral-400">Este pedido não existe ou não pertence à sua conta.</p>
      </div>
    )
  }

  const currentIndex = ALL_STATUSES.indexOf(order.projectStatus)

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-sm text-neutral-500 mb-2">
          Order #{order.id} · {formatDate(order.createdAt)}
        </p>
        <h1 className="text-3xl font-bold text-white">{order.productName}</h1>
      </div>

      {/* Progress bar */}
      <div className="bg-dark-card rounded-2xl border border-white/5 p-6 mb-8">
        <h2 className="text-sm font-semibold text-white uppercase tracking-widest mb-6">Progresso do projeto</h2>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {ALL_STATUSES.map((status, i) => {
            const done = i <= currentIndex
            const active = i === currentIndex
            return (
              <div key={status} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      active
                        ? 'bg-brand text-white ring-4 ring-brand/20'
                        : done
                        ? 'bg-brand/20 text-brand'
                        : 'bg-white/5 text-neutral-600'
                    }`}
                  >
                    {done && !active ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <p className={`text-xs mt-2 whitespace-nowrap ${active ? 'text-brand' : done ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {PROJECT_STATUS_LABELS[status]}
                  </p>
                </div>
                {i < ALL_STATUSES.length - 1 && (
                  <div className={`h-px w-8 md:w-12 mb-5 mx-1 ${i < currentIndex ? 'bg-brand/30' : 'bg-white/5'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
        <h2 className="text-sm font-semibold text-white uppercase tracking-widest mb-6">Atualizações</h2>
        {order.updates.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhuma atualização ainda.</p>
        ) : (
          <div className="space-y-6">
            {[...order.updates].reverse().map((update, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                  {i < order.updates.length - 1 && (
                    <div className="w-px flex-1 bg-white/5 mt-2" />
                  )}
                </div>
                <div className="pb-6">
                  <p className="font-medium text-white text-sm">{PROJECT_STATUS_LABELS[update.status]}</p>
                  <p className="text-sm text-neutral-400 mt-1">{update.note}</p>
                  <p className="text-xs text-neutral-600 mt-2">{formatDate(update.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
