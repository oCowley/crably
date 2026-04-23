'use client'

import { useState, useEffect, type FormEvent, type ReactNode } from 'react'
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  addDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import {
  Search, Eye, Pencil, Ban, X,
  User, Package, Calendar, DollarSign, Code2, AlertTriangle,
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { PROJECT_STATUS_LABELS, type ProjectStatus, PROJECT_STAGE_LABELS, type ProjectStage } from '@/types'

/* ─── Types ─────────────────────────────────────────────────── */

type OrderRow = {
  id: string
  userId: string
  productId: string
  assignedDevId: string | null
  customer: string
  email: string
  product: string
  status: ProjectStatus
  devName: string | null
  date: Date
  price: number
  businessName: string
  adminNotes: string
  deployUrl: string | null
  projectStage: string
}

type DevUser = { id: string; name: string }

/* ─── Helpers ────────────────────────────────────────────────── */

const STATUS_COLORS: Record<ProjectStatus, string> = {
  pending_payment: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  paid:            'text-blue-400 bg-blue-400/10 border-blue-400/20',
  queued:          'text-neutral-400 bg-neutral-400/10 border-neutral-400/20',
  assigned:        'text-purple-400 bg-purple-400/10 border-purple-400/20',
  in_progress:     'text-blue-400 bg-blue-400/10 border-blue-400/20',
  review:          'text-orange-400 bg-orange-400/10 border-orange-400/20',
  delivered:       'text-brand bg-brand/10 border-brand/20',
  completed:       'text-green-400 bg-green-400/10 border-green-400/20',
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatPrice(price: number) {
  return `R$ ${price.toLocaleString('pt-BR')}`
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(value as string)
}

/* ─── Shared input style ─────────────────────────────────────── */

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors'
const selectCls = `${inputCls} appearance-none cursor-pointer`

/* ─── View modal ─────────────────────────────────────────────── */

function ViewModal({ order, onClose }: { order: OrderRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#111111] border border-white/8 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">

        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <span className="text-xs font-mono text-neutral-600">{order.id}</span>
            <h2 className="text-base font-bold text-white mt-0.5">{order.product}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status]}`}>
              {PROJECT_STATUS_LABELS[order.status]}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0">
              <User size={16} className="text-brand" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 mb-1">Cliente</p>
              <p className="font-semibold text-white text-sm">{order.customer}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{order.email}</p>
              {order.businessName && <p className="text-xs text-neutral-600 mt-0.5 italic">{order.businessName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Package,    label: 'Produto',         value: order.product },
              { icon: DollarSign, label: 'Valor',           value: formatPrice(order.price), bold: true },
              { icon: Code2,      label: 'Dev responsável', value: order.devName ?? '' },
              { icon: Calendar,   label: 'Data do pedido',  value: formatDate(order.date) },
            ].map(({ icon: Icon, label, value, bold }) => (
              <div key={label} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
                <Icon size={15} className="text-neutral-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-neutral-500">{label}</p>
                  <p className={`text-sm mt-0.5 ${bold ? 'font-bold text-white' : 'font-medium text-white'}`}>
                    {value || <span className="text-neutral-600 italic font-normal text-xs">Não atribuído</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {order.adminNotes && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-xs text-neutral-500 mb-1.5">Observações</p>
              <p className="text-sm text-neutral-300 leading-relaxed">{order.adminNotes}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/5 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Edit modal ─────────────────────────────────────────────── */

function EditModal({
  order, devs, saving, onSave, onClose,
}: {
  order: OrderRow
  devs: DevUser[]
  saving: boolean
  onSave: (id: string, status: ProjectStatus, devId: string | null, notes: string, deployUrl: string, projectStage: ProjectStage) => void
  onClose: () => void
}) {
  const [status, setStatus]             = useState<ProjectStatus>(order.status)
  const [devId, setDevId]               = useState(order.assignedDevId ?? '')
  const [notes, setNotes]               = useState(order.adminNotes)
  const [deployUrl, setDeployUrl]       = useState(order.deployUrl ?? '')
  const [projectStage, setProjectStage] = useState<ProjectStage>(
    (order.projectStage as ProjectStage) ?? 'briefing'
  )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave(order.id, status, devId || null, notes, deployUrl, projectStage)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111111] border border-white/8 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">

        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <span className="text-xs font-mono text-neutral-600">{order.id}</span>
            <h2 className="text-base font-bold text-white mt-0.5">Editar pedido</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
              <User size={15} className="text-neutral-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{order.customer}</p>
                <p className="text-xs text-neutral-500 truncate">{order.product} · {formatPrice(order.price)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className={selectCls}
              >
                {(Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]).map(([key, label]) => (
                  <option key={key} value={key} className="bg-[#1a1a1a]">{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Dev responsável</label>
              <select
                value={devId}
                onChange={(e) => setDevId(e.target.value)}
                className={selectCls}
              >
                <option value="" className="bg-[#1a1a1a]">Sem dev atribuído</option>
                {devs.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#1a1a1a]">{d.name}</option>
                ))}
              </select>
            </div>

            {/* Deploy URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">URL de preview (deploy)</label>
              <input
                type="url"
                value={deployUrl}
                onChange={(e) => setDeployUrl(e.target.value)}
                placeholder="https://projeto-preview.vercel.app"
                className={inputCls}
              />
            </div>

            {/* Project stage */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Etapa do projeto (cliente)</label>
              <select
                value={projectStage}
                onChange={(e) => setProjectStage(e.target.value as ProjectStage)}
                className={selectCls}
              >
                {(Object.entries(PROJECT_STAGE_LABELS) as [ProjectStage, string][]).map(([key, label]) => (
                  <option key={key} value={key} className="bg-[#1a1a1a]">{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Observações internas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Adicione notas internas sobre este pedido..."
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-white/5 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Cancel modal ───────────────────────────────────────────── */

function CancelModal({ order, onConfirm, onClose }: { order: OrderRow; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#111111] border border-white/8 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        <div className="px-6 pt-6 pb-5 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center justify-center">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Cancelar pedido?</h2>
            <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">
              O pedido <span className="font-mono text-neutral-300">{order.id}</span> de{' '}
              <span className="text-white font-medium">{order.customer}</span> será removido. Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            Voltar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Action button ──────────────────────────────────────────── */

function ActionBtn({ onClick, title, className, children }: {
  onClick: () => void
  title: string
  className: string
  children: ReactNode
}) {
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-lg transition-all ${className}`}>
      {children}
    </button>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function PedidosPage() {
  const [orders, setOrders]         = useState<OrderRow[]>([])
  const [devs, setDevs]             = useState<DevUser[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [saving, setSaving]         = useState(false)
  const [viewing, setViewing]       = useState<OrderRow | null>(null)
  const [editing, setEditing]       = useState<OrderRow | null>(null)
  const [cancelling, setCancelling] = useState<OrderRow | null>(null)

  useEffect(() => {
    async function fetchAll() {
      const [ordersSnap, usersSnap, productsSnap, detailsSnap] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'orderDetails')),
      ])

      const userMap = new Map(
        usersSnap.docs.map((d) => [d.id, d.data() as { name: string; email: string; role: string }])
      )
      const productMap = new Map(
        productsSnap.docs.map((d) => [d.id, d.data() as { name: string; price: number }])
      )
      // orderDetails is keyed by orderId
      const detailsMap = new Map(
        detailsSnap.docs.map((d) => [d.data().orderId as string, d.data() as { businessName: string }])
      )

      const devUsers: DevUser[] = usersSnap.docs
        .filter((d) => d.data().role === 'developer')
        .map((d) => ({ id: d.id, name: d.data().name as string }))

      const rows: OrderRow[] = ordersSnap.docs.map((d) => {
        const data = d.data()
        const customer = userMap.get(data.userId) ?? { name: 'Desconhecido', email: '' }
        const product  = productMap.get(data.productId) ?? { name: 'Produto desconhecido', price: 0 }
        const details  = detailsMap.get(d.id)
        const dev      = data.assignedDevId ? userMap.get(data.assignedDevId) : null

        return {
          id:            d.id,
          userId:        data.userId,
          productId:     data.productId,
          assignedDevId: data.assignedDevId ?? null,
          customer:      customer.name,
          email:         customer.email,
          product:       product.name,
          status:        data.projectStatus as ProjectStatus,
          devName:       dev?.name ?? null,
          date:          toDate(data.createdAt),
          price:         product.price,
          businessName:  details?.businessName ?? '',
          adminNotes:    data.adminNotes ?? '',
          deployUrl:     data.deployUrl ?? null,
          projectStage:  data.projectStage ?? 'briefing',
        }
      })

      rows.sort((a, b) => b.date.getTime() - a.date.getTime())
      setOrders(rows)
      setDevs(devUsers)
    }

    fetchAll().finally(() => setLoading(false))
  }, [])

  async function handleSave(id: string, status: ProjectStatus, devId: string | null, adminNotes: string, deployUrl: string, projectStage: ProjectStage) {
    setSaving(true)
    try {
      const prev = orders.find((o) => o.id === id)!

      await updateDoc(doc(db, 'orders', id), {
        projectStatus: status,
        assignedDevId: devId ?? null,
        adminNotes,
        deployUrl: deployUrl || null,
        projectStage,
      })

      if (prev.status !== status) {
        await addDoc(collection(db, 'projectUpdates'), {
          orderId: id,
          status,
          note: `Status atualizado para: ${PROJECT_STATUS_LABELS[status]}`,
          createdAt: serverTimestamp(),
        })
      }

      const dev = devId ? devs.find((d) => d.id === devId) : null
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, status, assignedDevId: devId, devName: dev?.name ?? null, adminNotes, deployUrl: deployUrl || null, projectStage }
            : o
        )
      )
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel(order: OrderRow) {
    await deleteDoc(doc(db, 'orders', order.id))
    setOrders((prev) => prev.filter((o) => o.id !== order.id))
    setCancelling(null)
  }

  const filtered = search
    ? orders.filter((o) =>
        o.customer.toLowerCase().includes(search.toLowerCase()) ||
        o.email.toLowerCase().includes(search.toLowerCase()) ||
        o.product.toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase())
      )
    : orders

  const summary = [
    { label: 'Total',          value: loading ? '—' : orders.length },
    { label: 'Em andamento',   value: loading ? '—' : orders.filter((o) => ['in_progress', 'review', 'assigned'].includes(o.status)).length },
    { label: 'Aguardando dev', value: loading ? '—' : orders.filter((o) => ['queued', 'paid'].includes(o.status)).length },
    { label: 'Concluídos',     value: loading ? '—' : orders.filter((o) => ['completed', 'delivered'].includes(o.status)).length },
  ]

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Pedidos</h1>
          <p className="text-neutral-500 text-sm">Gerencie projetos e atribua desenvolvedores.</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.map((s) => (
            <div key={s.label} className="bento-card p-5">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bento-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-sm font-semibold text-white flex-1">Todos os pedidos</h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="search"
                placeholder="Buscar pedido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/40 w-full sm:w-48"
              />
            </div>
          </div>

          {loading ? (
            <div className="divide-y divide-white/5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-6 py-4 h-16 animate-pulse bg-white/[0.02]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package size={32} className="text-neutral-700 mb-3" />
              <p className="text-sm text-neutral-500">
                {search ? 'Nenhum pedido encontrado.' : 'Nenhum pedido cadastrado ainda.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['ID', 'Cliente', 'Produto', 'Dev', 'Status', 'Valor', 'Data', 'Ações'].map((h) => (
                        <th key={h} className={`px-6 py-3 text-left text-xs font-medium text-neutral-500 ${h === 'Ações' ? 'text-right' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-xs text-neutral-500 font-mono">{order.id.slice(0, 8)}…</td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-white text-sm">{order.customer}</p>
                          <p className="text-xs text-neutral-500">{order.email}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-300">{order.product}</td>
                        <td className="px-6 py-4 text-sm">
                          {order.devName
                            ? <span className="text-neutral-300">{order.devName}</span>
                            : <span className="text-neutral-600 italic text-xs">Sem dev</span>
                          }
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status]}`}>
                            {PROJECT_STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-300">{formatPrice(order.price)}</td>
                        <td className="px-6 py-4 text-xs text-neutral-500">{formatDate(order.date)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-0.5">
                            <ActionBtn onClick={() => setViewing(order)} title="Visualizar" className="text-neutral-500 hover:text-white hover:bg-white/8">
                              <Eye size={14} />
                            </ActionBtn>
                            <ActionBtn onClick={() => setEditing(order)} title="Editar" className="text-neutral-500 hover:text-brand hover:bg-brand/8">
                              <Pencil size={14} />
                            </ActionBtn>
                            <ActionBtn onClick={() => setCancelling(order)} title="Cancelar pedido" className="text-neutral-500 hover:text-red-400 hover:bg-red-400/8">
                              <Ban size={13} />
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-white/5">
                {filtered.map((order) => (
                  <div key={order.id} className="px-5 py-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500 font-mono">{order.id.slice(0, 8)}…</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status]}`}>
                        {PROJECT_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="font-medium text-white text-sm">{order.customer}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">{order.product}</span>
                      <span className="text-xs text-neutral-400 font-medium">{formatPrice(order.price)}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={() => setViewing(order)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white bg-white/5 rounded-lg transition-colors">
                        <Eye size={12} /> Ver
                      </button>
                      <button onClick={() => setEditing(order)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-brand bg-white/5 rounded-lg transition-colors">
                        <Pencil size={12} /> Editar
                      </button>
                      <button onClick={() => setCancelling(order)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-red-400 bg-white/5 rounded-lg transition-colors">
                        <Ban size={12} /> Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {viewing    && <ViewModal   order={viewing}    onClose={() => setViewing(null)} />}
      {editing    && <EditModal   order={editing}    devs={devs} saving={saving} onSave={handleSave} onClose={() => setEditing(null)} />}
      {cancelling && <CancelModal order={cancelling} onConfirm={() => handleCancel(cancelling)} onClose={() => setCancelling(null)} />}
    </>
  )
}
