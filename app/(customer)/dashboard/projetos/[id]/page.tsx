'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { DashboardOrder, ProjectStage } from '@/types'
import StageFlow from './StageFlow'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ProjetoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<DashboardOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'orders', id), (snap) => {
      if (!snap.exists()) { router.push('/dashboard/projetos'); return }
      const data = snap.data()
      if (data.userId !== user?.uid) { router.push('/dashboard/projetos'); return }
      setOrder({
        id: snap.id,
        userId: data.userId,
        assignedDevId: data.assignedDevId ?? null,
        productName: data.productName ?? '',
        productType: data.productType ?? '',
        projectName: data.projectName ?? '',
        briefing: data.briefing ?? '',
        reference: data.reference ?? '',
        prazo: data.prazo ?? '14dias',
        price: data.price ?? 0,
        projectStage: (data.projectStage as ProjectStage) ?? 'briefing',
        stripeSessionId: data.stripeSessionId ?? '',
        deliveryUrl: data.deliveryUrl ?? null,
        deployUrl: data.deployUrl ?? null,
        meetLink: data.meetLink ?? null,
        meetDate: data.meetDate ?? null,
        revisionPaid: data.revisionPaid ?? false,
        devProgress: data.devProgress ?? 0,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        developmentStartedAt: data.developmentStartedAt instanceof Timestamp
          ? data.developmentStartedAt.toDate()
          : null,
      })
      setLoading(false)
    })
    return unsub
  }, [id, user, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-neutral-600" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/dashboard/projetos"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{order.productName}</h1>
          {order.projectName && (
            <p className="text-sm text-neutral-500 mt-0.5">{order.projectName}</p>
          )}
        </div>
      </div>
      <StageFlow order={order} />
    </div>
  )
}
