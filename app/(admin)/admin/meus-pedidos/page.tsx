'use client'

import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { DashboardOrder, ProjectStage } from '@/types'
import { Briefcase, Loader2 } from 'lucide-react'
import DevOrderCard from './DevOrderCard'

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(value as string)
}

export default function MeusPedidosPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders]   = useState<DashboardOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const snap = await getDocs(
        query(collection(db, 'orders'), where('assignedDevId', '==', user.uid))
      )
      const rows: DashboardOrder[] = snap.docs.map((d) => {
        const data = d.data()
        return {
          id:                   d.id,
          userId:               data.userId ?? '',
          assignedDevId:        data.assignedDevId ?? null,
          productName:          data.productName ?? '',
          productType:          data.productType ?? '',
          projectName:          data.projectName ?? data.productName ?? '',
          briefing:             data.briefing ?? '',
          reference:            data.reference ?? '',
          prazo:                data.prazo ?? '14dias',
          price:                data.price ?? 0,
          stripeSessionId:      data.stripeSessionId ?? '',
          deliveryUrl:          data.deliveryUrl ?? null,
          createdAt:            toDate(data.createdAt),
          projectStage:         (data.projectStage ?? 'em_desenvolvimento') as ProjectStage,
          meetLink:             data.meetLink ?? null,
          meetDate:             data.meetDate ?? null,
          deployUrl:            data.deployUrl ?? null,
          devProgress:          data.devProgress ?? 0,
          revisionPaid:         data.revisionPaid ?? false,
          developmentStartedAt: data.developmentStartedAt ? toDate(data.developmentStartedAt) : null,
          briefingNotes:        data.briefingNotes,
          references:           data.references,
          meetSlotId:           data.meetSlotId,
          domainHost:           data.domainHost,
          domainUser:           data.domainUser,
          domainPass:           data.domainPass,
          domainNotes:          data.domainNotes,
        }
      })
      rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setOrders(rows)
    } catch (err) {
      console.error('Failed to fetch orders', err)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => {
    if (!authLoading) fetchOrders()
  }, [authLoading, fetchOrders])

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 size={24} className="animate-spin text-neutral-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Meus Pedidos</h1>
        <p className="text-neutral-500 text-sm">
          {orders.length === 0
            ? 'Nenhum pedido atribuído a você ainda.'
            : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} atribuído${orders.length !== 1 ? 's' : ''} a você.`}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-neutral-600">
          <Briefcase size={36} strokeWidth={1.5} />
          <p className="text-sm">Nenhum pedido atribuído a você ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {orders.map((order) => (
            <DevOrderCard key={order.id} order={order} onRefresh={fetchOrders} />
          ))}
        </div>
      )}
    </div>
  )
}
