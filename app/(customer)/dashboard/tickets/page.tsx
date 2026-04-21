'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import {
  LifeBuoy, Plus, X, Loader2, MessageSquare,
  CheckCircle2, Clock, AlertCircle, ChevronRight,
  Package,
} from 'lucide-react'

// ─── types ────────────────────────────────────────────────────────────────────

type TicketStatus   = 'aberto' | 'em_andamento' | 'resolvido'
type TicketPriority = 'alta' | 'media' | 'baixa'
type TicketCategory = 'problema_tecnico' | 'duvida' | 'pagamento' | 'entrega' | 'outro'

type Ticket = {
  id: string
  subject: string
  description: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  orderId: string | null
  orderName: string | null
  date: Date
}

type OrderOption = { id: string; name: string }

// ─── constants ────────────────────────────────────────────────────────────────

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

const STATUS_ICONS: Record<TicketStatus, React.ElementType> = {
  aberto:       AlertCircle,
  em_andamento: Clock,
  resolvido:    CheckCircle2,
}

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  problema_tecnico: 'Problema técnico',
  duvida:           'Dúvida',
  pagamento:        'Pagamento',
  entrega:          'Entrega / prazo',
  outro:            'Outro',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate()
  if (v instanceof Date) return v
  return new Date(v as string)
}

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatRelative(d: Date) {
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora mesmo'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  return formatDate(d)
}

const inputCls  = 'w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors'
const selectCls = `${inputCls} appearance-none cursor-pointer`

// ─── new ticket modal ─────────────────────────────────────────────────────────

function NewTicketModal({
  orders,
  saving,
  onSave,
  onClose,
}: {
  orders: OrderOption[]
  saving: boolean
  onSave: (data: { subject: string; description: string; category: TicketCategory; orderId: string }) => void
  onClose: () => void
}) {
  const [subject,     setSubject]     = useState('')
  const [description, setDescription] = useState('')
  const [category,    setCategory]    = useState<TicketCategory>('duvida')
  const [orderId,     setOrderId]     = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) return
    onSave({ subject: subject.trim(), description: description.trim(), category, orderId })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#111111] border border-white/8 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">

        {/* header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <LifeBuoy size={16} className="text-brand" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Abrir chamado</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Nossa equipe responde em até 24h</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">
                Categoria <span className="text-brand">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className={selectCls}
              >
                {(Object.entries(CATEGORY_LABELS) as [TicketCategory, string][]).map(([key, label]) => (
                  <option key={key} value={key} className="bg-[#1a1a1a]">{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">
                Assunto <span className="text-brand">*</span>
              </label>
              <input
                required
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Resuma o problema em uma frase..."
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">
                Descrição <span className="text-brand">*</span>
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva com detalhes o que aconteceu, o que você esperava e o que aconteceu de diferente..."
                className={`${inputCls} resize-none h-28`}
              />
            </div>

            {orders.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">
                  Pedido relacionado <span className="text-neutral-600">(opcional)</span>
                </label>
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className={selectCls}
                >
                  <option value="" className="bg-[#1a1a1a]">Nenhum pedido específico</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id} className="bg-[#1a1a1a]">
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <MessageSquare size={13} className="text-neutral-500 mt-0.5 shrink-0" />
              <p className="text-xs text-neutral-500 leading-relaxed">
                Após abrir o chamado, nossa equipe irá analisar e entrar em contato pelo email cadastrado.
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-white/5 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Enviando...' : 'Abrir chamado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── ticket detail modal ──────────────────────────────────────────────────────

function TicketDetailModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const StatusIcon = STATUS_ICONS[ticket.status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111111] border border-white/8 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">

        {/* header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/5">
          <div className="flex-1 min-w-0 pr-4">
            <span className="text-[11px] font-mono text-neutral-600">#{ticket.id.slice(0, 8)}</span>
            <h2 className="text-base font-bold text-white mt-0.5 leading-snug">{ticket.subject}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors shrink-0 mt-0.5">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* status */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${STATUS_STYLES[ticket.status]}`}>
            <StatusIcon size={18} className="shrink-0" />
            <div>
              <p className="text-sm font-semibold">{STATUS_LABELS[ticket.status]}</p>
              <p className="text-xs opacity-70 mt-0.5">
                {ticket.status === 'aberto'       && 'Aguardando análise da equipe'}
                {ticket.status === 'em_andamento' && 'Nossa equipe está trabalhando nisso'}
                {ticket.status === 'resolvido'    && 'Chamado encerrado com sucesso'}
              </p>
            </div>
          </div>

          {/* description */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-neutral-500">Sua mensagem</p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[11px] text-neutral-500 mb-1">Categoria</p>
              <p className="text-sm font-medium text-white">{CATEGORY_LABELS[ticket.category]}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[11px] text-neutral-500 mb-1">Aberto em</p>
              <p className="text-sm font-medium text-white">{formatDate(ticket.date)}</p>
            </div>
          </div>

          {ticket.orderId && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <Package size={14} className="text-neutral-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-neutral-500">Pedido vinculado</p>
                <p className="text-sm font-medium text-white truncate">{ticket.orderName ?? ticket.orderId.slice(0, 12) + '…'}</p>
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-neutral-500 leading-relaxed">
            Para atualizações sobre este chamado, verifique seu email cadastrado. Nosso time responde em até 24h úteis.
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

// ─── page ─────────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [tickets,  setTickets]  = useState<Ticket[]>([])
  const [orders,   setOrders]   = useState<OrderOption[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [creating, setCreating] = useState(false)
  const [viewing,  setViewing]  = useState<Ticket | null>(null)
  const [filter,   setFilter]   = useState<TicketStatus | 'todos'>('todos')

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) { setLoading(false); return }

    async function load() {
      try {
        const [ticketsSnap, ordersSnap] = await Promise.all([
          getDocs(query(collection(db, 'tickets'), where('userId', '==', uid))),
          getDocs(query(collection(db, 'orders'),  where('userId', '==', uid))),
        ])

        // product name map for order display
        const productIds = [...new Set(ordersSnap.docs.map((d) => d.data().productId as string))]
        const productMap: Record<string, string> = {}
        if (productIds.length) {
          const prodSnaps = await getDocs(collection(db, 'products'))
          prodSnaps.forEach((d) => { productMap[d.id] = d.data().name as string })
        }

        const orderOptions: OrderOption[] = ordersSnap.docs.map((d) => ({
          id:   d.id,
          name: productMap[d.data().productId] ?? `Pedido ${d.id.slice(0, 6)}`,
        }))

        const orderMap = new Map(orderOptions.map((o) => [o.id, o.name]))

        const rows: Ticket[] = ticketsSnap.docs.map((d) => {
          const data = d.data()
          return {
            id:          d.id,
            subject:     data.subject,
            description: data.description ?? '',
            category:    (data.category as TicketCategory) ?? 'outro',
            status:      data.status as TicketStatus,
            priority:    data.priority as TicketPriority,
            orderId:     data.orderId ?? null,
            orderName:   data.orderId ? (orderMap.get(data.orderId) ?? null) : null,
            date:        toDate(data.createdAt),
          }
        })

        rows.sort((a, b) => b.date.getTime() - a.date.getTime())
        setTickets(rows)
        setOrders(orderOptions)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  async function handleCreate(data: { subject: string; description: string; category: TicketCategory; orderId: string }) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    setSaving(true)
    try {
      const ref = await addDoc(collection(db, 'tickets'), {
        userId:      uid,
        subject:     data.subject,
        description: data.description,
        category:    data.category,
        status:      'aberto' as TicketStatus,
        priority:    'media' as TicketPriority,
        orderId:     data.orderId || null,
        createdAt:   serverTimestamp(),
        messageCount: 0,
      })

      const newTicket: Ticket = {
        id:          ref.id,
        subject:     data.subject,
        description: data.description,
        category:    data.category,
        status:      'aberto',
        priority:    'media',
        orderId:     data.orderId || null,
        orderName:   data.orderId ? (orders.find((o) => o.id === data.orderId)?.name ?? null) : null,
        date:        new Date(),
      }

      setTickets((prev) => [newTicket, ...prev])
      setCreating(false)
      setViewing(newTicket)
    } finally {
      setSaving(false)
    }
  }

  const filtered = filter === 'todos' ? tickets : tickets.filter((t) => t.status === filter)
  const abertos     = tickets.filter((t) => t.status === 'aberto').length
  const emAndamento = tickets.filter((t) => t.status === 'em_andamento').length
  const resolvidos  = tickets.filter((t) => t.status === 'resolvido').length

  const TABS: { key: TicketStatus | 'todos'; label: string; count?: number }[] = [
    { key: 'todos',        label: 'Todos',        count: tickets.length },
    { key: 'aberto',       label: 'Abertos',      count: abertos },
    { key: 'em_andamento', label: 'Em andamento', count: emAndamento },
    { key: 'resolvido',    label: 'Resolvidos',   count: resolvidos },
  ]

  return (
    <>
      <div className="space-y-8">

        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Suporte</h1>
            <p className="text-neutral-400 text-sm mt-1">Abra chamados e acompanhe o status do atendimento.</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
          >
            <Plus size={15} />
            Abrir chamado
          </button>
        </div>

        {/* stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Abertos',      value: abertos,     color: 'text-red-400',    icon: AlertCircle },
            { label: 'Em andamento', value: emAndamento, color: 'text-yellow-400', icon: Clock },
            { label: 'Resolvidos',   value: resolvidos,  color: 'text-green-400',  icon: CheckCircle2 },
          ].map((s) => (
            <div key={s.label} className="bento-card p-5 flex items-start gap-3">
              <s.icon size={18} className={`${s.color} mt-0.5 shrink-0`} />
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{loading ? '—' : s.value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* list */}
        <div className="bento-card overflow-hidden">

          {/* tabs */}
          <div className="px-5 pt-4 pb-0 border-b border-white/5 flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={[
                  'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-t-lg border-b-2 -mb-px transition-colors whitespace-nowrap',
                  filter === tab.key
                    ? 'text-white border-brand bg-brand/5'
                    : 'text-neutral-500 border-transparent hover:text-neutral-300',
                ].join(' ')}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    filter === tab.key ? 'bg-brand/20 text-brand' : 'bg-white/8 text-neutral-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-px">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 px-5 py-4 animate-pulse bg-white/[0.015]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                <LifeBuoy size={24} className="text-neutral-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-400">
                  {filter === 'todos' ? 'Nenhum chamado aberto' : `Nenhum chamado ${STATUS_LABELS[filter as TicketStatus].toLowerCase()}`}
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  {filter === 'todos' && 'Encontrou algum problema? Clique em "Abrir chamado".'}
                </p>
              </div>
              {filter === 'todos' && (
                <button
                  onClick={() => setCreating(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors"
                >
                  <Plus size={14} />
                  Abrir chamado
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((ticket) => {
                const StatusIcon = STATUS_ICONS[ticket.status]
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setViewing(ticket)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.025] transition-colors text-left"
                  >
                    {/* status dot */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${STATUS_STYLES[ticket.status]}`}>
                      <StatusIcon size={14} />
                    </div>

                    {/* content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-white truncate">{ticket.subject}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-neutral-600">{CATEGORY_LABELS[ticket.category]}</span>
                        {ticket.orderName && (
                          <>
                            <span className="text-neutral-700">·</span>
                            <span className="text-xs text-neutral-600 flex items-center gap-1">
                              <Package size={10} />
                              {ticket.orderName}
                            </span>
                          </>
                        )}
                        <span className="text-neutral-700">·</span>
                        <span className="text-xs text-neutral-600">{formatRelative(ticket.date)}</span>
                      </div>
                    </div>

                    {/* status badge + arrow */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`hidden sm:inline px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[ticket.status]}`}>
                        {STATUS_LABELS[ticket.status]}
                      </span>
                      <ChevronRight size={14} className="text-neutral-600" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {creating && (
        <NewTicketModal
          orders={orders}
          saving={saving}
          onSave={handleCreate}
          onClose={() => setCreating(false)}
        />
      )}

      {viewing && (
        <TicketDetailModal
          ticket={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  )
}
