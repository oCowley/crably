'use client'

import { useState, useEffect, type FormEvent } from 'react'
import {
  collection, getDocs, doc, updateDoc, addDoc,
  serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { Plus, MessageSquare, X } from 'lucide-react'
import { db } from '@/lib/firebase'

/* ─── Types ─────────────────────────────────────────────────── */

type TicketStatus   = 'aberto' | 'em_andamento' | 'resolvido'
type TicketPriority = 'alta' | 'media' | 'baixa'

type TicketRow = {
  id: string
  userId: string
  customer: string
  email: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  orderId: string | null
  date: Date
  messageCount: number
}

type CustomerOption = { id: string; name: string; email: string }

/* ─── Style maps ─────────────────────────────────────────────── */

const STATUS_STYLES: Record<TicketStatus, string> = {
  aberto:       'text-red-400 bg-red-400/10 border-red-400/20',
  em_andamento: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  resolvido:    'text-green-400 bg-green-400/10 border-green-400/20',
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  aberto:       'Aberto',
  em_andamento: 'Em andamento',
  resolvido:    'Resolvido',
}

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  alta:  'text-red-400',
  media: 'text-yellow-400',
  baixa: 'text-neutral-500',
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  alta:  'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

const TABS: { key: TicketStatus | 'todos'; label: string }[] = [
  { key: 'todos',       label: 'Todos' },
  { key: 'aberto',      label: 'Abertos' },
  { key: 'em_andamento',label: 'Em andamento' },
  { key: 'resolvido',   label: 'Resolvidos' },
]

/* ─── Helpers ────────────────────────────────────────────────── */

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(value as string)
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const inputCls  = 'w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors'
const selectCls = `${inputCls} appearance-none cursor-pointer`

/* ─── New ticket modal ───────────────────────────────────────── */

function NewTicketModal({
  customers,
  saving,
  onSave,
  onClose,
}: {
  customers: CustomerOption[]
  saving: boolean
  onSave: (userId: string, subject: string, priority: TicketPriority, orderId: string) => void
  onClose: () => void
}) {
  const [userId,   setUserId]   = useState('')
  const [subject,  setSubject]  = useState('')
  const [priority, setPriority] = useState<TicketPriority>('media')
  const [orderId,  setOrderId]  = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!userId || !subject.trim()) return
    onSave(userId, subject.trim(), priority, orderId.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111111] border border-white/8 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">

        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <h2 className="text-base font-bold text-white">Novo ticket</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Cliente</label>
              <select
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={selectCls}
              >
                <option value="" className="bg-[#1a1a1a]">Selecione um cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#1a1a1a]">{c.name} — {c.email}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Assunto</label>
              <input
                required
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Descreva o assunto do ticket..."
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className={selectCls}
              >
                {(Object.entries(PRIORITY_LABELS) as [TicketPriority, string][]).map(([key, label]) => (
                  <option key={key} value={key} className="bg-[#1a1a1a]">{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">
                ID do pedido <span className="text-neutral-600">(opcional)</span>
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Ex: abc123..."
                className={inputCls}
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
              {saving ? 'Criando...' : 'Criar ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Ticket detail modal ────────────────────────────────────── */

function TicketDetailModal({
  ticket,
  saving,
  onUpdateStatus,
  onClose,
}: {
  ticket: TicketRow
  saving: boolean
  onUpdateStatus: (id: string, status: TicketStatus) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111111] border border-white/8 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">

        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <span className="text-xs font-mono text-neutral-600">{ticket.id.slice(0, 8)}…</span>
            <h2 className="text-base font-bold text-white mt-0.5 pr-4">{ticket.subject}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Customer */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-xs text-neutral-500 mb-1">Cliente</p>
            <p className="text-sm font-semibold text-white">{ticket.customer}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{ticket.email}</p>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-xs text-neutral-500 mb-1">Prioridade</p>
              <p className={`text-sm font-semibold ${PRIORITY_STYLES[ticket.priority]}`}>
                {PRIORITY_LABELS[ticket.priority]}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-xs text-neutral-500 mb-1">Aberto em</p>
              <p className="text-sm font-medium text-white">{formatDate(ticket.date)}</p>
            </div>
          </div>

          {ticket.orderId && (
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-xs text-neutral-500 mb-1">Pedido vinculado</p>
              <p className="text-sm font-mono text-neutral-300">{ticket.orderId}</p>
            </div>
          )}

          {/* Status actions */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-neutral-400">Atualizar status</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(STATUS_LABELS) as [TicketStatus, string][]).map(([key, label]) => (
                <button
                  key={key}
                  disabled={ticket.status === key || saving}
                  onClick={() => onUpdateStatus(ticket.id, key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    ticket.status === key
                      ? STATUS_STYLES[key]
                      : 'text-neutral-500 border-white/10 hover:text-white hover:border-white/20 bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
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

/* ─── Page ───────────────────────────────────────────────────── */

export default function TicketsPage() {
  const [tickets,   setTickets]   = useState<TicketRow[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [activeTab, setActiveTab] = useState<TicketStatus | 'todos'>('todos')
  const [creating,  setCreating]  = useState(false)
  const [viewing,   setViewing]   = useState<TicketRow | null>(null)

  useEffect(() => {
    async function fetchAll() {
      const [ticketsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'tickets')),
        getDocs(collection(db, 'users')),
      ])

      const userMap = new Map(
        usersSnap.docs.map((d) => [d.id, d.data() as { name: string; email: string; role: string }])
      )

      const customerList: CustomerOption[] = usersSnap.docs
        .filter((d) => d.data().role === 'customer')
        .map((d) => ({ id: d.id, name: d.data().name as string, email: d.data().email as string }))

      const rows: TicketRow[] = ticketsSnap.docs.map((d) => {
        const data = d.data()
        const user = userMap.get(data.userId) ?? { name: 'Desconhecido', email: '' }
        return {
          id:           d.id,
          userId:       data.userId,
          customer:     user.name,
          email:        user.email,
          subject:      data.subject,
          status:       data.status as TicketStatus,
          priority:     data.priority as TicketPriority,
          orderId:      data.orderId ?? null,
          date:         toDate(data.createdAt),
          messageCount: data.messageCount ?? 0,
        }
      })

      rows.sort((a, b) => b.date.getTime() - a.date.getTime())
      setTickets(rows)
      setCustomers(customerList)
    }

    fetchAll().finally(() => setLoading(false))
  }, [])

  async function handleCreate(userId: string, subject: string, priority: TicketPriority, orderId: string) {
    setSaving(true)
    try {
      const ref = await addDoc(collection(db, 'tickets'), {
        userId,
        subject,
        status: 'aberto' as TicketStatus,
        priority,
        orderId: orderId || null,
        createdAt: serverTimestamp(),
        messageCount: 0,
      })

      const customer = customers.find((c) => c.id === userId)!
      setTickets((prev) => [{
        id:           ref.id,
        userId,
        customer:     customer.name,
        email:        customer.email,
        subject,
        status:       'aberto',
        priority,
        orderId:      orderId || null,
        date:         new Date(),
        messageCount: 0,
      }, ...prev])
      setCreating(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateStatus(id: string, status: TicketStatus) {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'tickets', id), { status })
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
      setViewing((prev) => (prev?.id === id ? { ...prev, status } : prev))
    } finally {
      setSaving(false)
    }
  }

  const abertos     = tickets.filter((t) => t.status === 'aberto').length
  const emAndamento = tickets.filter((t) => t.status === 'em_andamento').length
  const resolvidos  = tickets.filter((t) => t.status === 'resolvido').length

  const filtered = activeTab === 'todos' ? tickets : tickets.filter((t) => t.status === activeTab)

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Tickets</h1>
            <p className="text-neutral-500 text-sm">Central de suporte e comunicação com clientes.</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
          >
            <Plus size={16} />
            Novo ticket
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Abertos',       value: loading ? '—' : abertos,     color: 'text-red-400' },
            { label: 'Em andamento',  value: loading ? '—' : emAndamento, color: 'text-yellow-400' },
            { label: 'Resolvidos',    value: loading ? '—' : resolvidos,  color: 'text-green-400' },
          ].map((s) => (
            <div key={s.label} className="bento-card p-5">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tickets list */}
        <div className="bento-card overflow-hidden">
          {/* Tabs */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-brand/10 text-brand'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                }`}
              >
                {tab.label}
                {tab.key === 'aberto' && abertos > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-red-400/20 text-red-400">
                    {abertos}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="divide-y divide-white/5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-6 py-4 h-20 animate-pulse bg-white/[0.02]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare size={32} className="text-neutral-700 mb-3" />
              <p className="text-sm text-neutral-500">Nenhum ticket encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setViewing(ticket)}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="pt-0.5 shrink-0">
                    <div className={`w-2 h-2 rounded-full mt-1 ${
                      ticket.status === 'aberto'       ? 'bg-red-400' :
                      ticket.status === 'em_andamento' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-neutral-600">{ticket.id.slice(0, 8)}…</span>
                      {ticket.orderId && (
                        <span className="text-xs text-neutral-600 bg-white/5 px-2 py-0.5 rounded-full">
                          {ticket.orderId.slice(0, 8)}…
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-white text-sm">{ticket.subject}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{ticket.customer} · {ticket.email}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={PRIORITY_STYLES[ticket.priority]}>
                        {PRIORITY_LABELS[ticket.priority]}
                      </span>
                      <span className="flex items-center gap-1 text-neutral-600">
                        <MessageSquare size={11} />
                        {ticket.messageCount}
                      </span>
                      <span className="text-neutral-600 hidden sm:inline">{formatDate(ticket.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {creating && (
        <NewTicketModal
          customers={customers}
          saving={saving}
          onSave={handleCreate}
          onClose={() => setCreating(false)}
        />
      )}
      {viewing && (
        <TicketDetailModal
          ticket={viewing}
          saving={saving}
          onUpdateStatus={handleUpdateStatus}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  )
}
