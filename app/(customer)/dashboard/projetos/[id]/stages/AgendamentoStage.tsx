'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DashboardOrder, MeetSlot } from '@/types'
import { Calendar, Clock, CheckCircle2, Loader2, Video, AlertCircle } from 'lucide-react'

export default function AgendamentoStage({ order }: { order: DashboardOrder; active: boolean; done: boolean }) {
  const [slots, setSlots]       = useState<MeetSlot[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [booking, setBooking]   = useState(false)
  const [booked, setBooked]     = useState(false)

  const isConfirmed = order.projectStage === 'meet_confirmado'

  useEffect(() => {
    if (isConfirmed || order.meetSlotId) { setLoading(false); return }
    getDocs(query(collection(db, 'meetSlots'), where('available', '==', true)))
      .then((snap) => {
        const today = new Date()
        const cutoff = addBusinessDays(today, 7)
        const rows: MeetSlot[] = snap.docs
          .map((d) => ({
            id: d.id,
            date: d.data().date as string,
            hour: d.data().hour as string,
            available: d.data().available as boolean,
          }))
          .filter((s) => {
            const slotDate = new Date(s.date + 'T00:00:00')
            const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
            return slotDate >= todayMidnight && slotDate <= cutoff
          })
          .sort((a, b) => `${a.date}${a.hour}`.localeCompare(`${b.date}${b.hour}`))
        setSlots(rows)
      })
      .finally(() => setLoading(false))
  }, [isConfirmed, order.meetSlotId])

  function addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date)
    let added = 0
    while (added < days) {
      result.setDate(result.getDate() + 1)
      const dow = result.getDay()
      if (dow !== 0 && dow !== 6) added++
    }
    return result
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  }

  async function handleBook() {
    if (!selected) return
    setBooking(true)
    await fetch(`/api/projetos/${order.id}/slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: selected }),
    })
    setBooked(true)
    setBooking(false)
  }

  if (order.meetSlotId && !isConfirmed) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8">
        <Clock size={16} className="text-orange-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">Horário selecionado!</p>
          <p className="text-xs text-neutral-400 mt-1">
            Aguardando nossa equipe confirmar o meet e enviar o link. Você será notificado aqui.
          </p>
        </div>
      </div>
    )
  }

  if (isConfirmed && order.meetLink) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-brand/10 border border-brand/20">
          <Video size={16} className="text-brand mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Meet confirmado!</p>
            {order.meetDate && (
              <p className="text-xs text-neutral-400 mt-0.5">{order.meetDate}</p>
            )}
            <a
              href={order.meetLink.startsWith('http') ? order.meetLink : `https://${order.meetLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-brand hover:underline"
            >
              Entrar no Google Meet →
            </a>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          Após o meet, o desenvolvimento do seu projeto começa automaticamente.
        </p>
      </div>
    )
  }

  if (booked) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
        <CheckCircle2 size={16} className="text-green-400" />
        <div>
          <p className="text-sm font-semibold text-green-400">Horário reservado!</p>
          <p className="text-xs text-green-400/70 mt-0.5">Aguardando confirmação da nossa equipe.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-300 leading-relaxed">
        Escolha um horário disponível para uma conversa rápida com o desenvolvedor do seu projeto.
        Horário comercial, de segunda a sexta, das 8h às 17h.
      </p>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-neutral-600" />
        </div>
      ) : slots.length === 0 ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8">
          <AlertCircle size={15} className="text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-sm text-neutral-400">
            Nenhum horário disponível nos próximos 7 dias úteis. Nossa equipe entrará em contato em breve.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelected(slot.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selected === slot.id
                    ? 'border-brand bg-brand/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={11} className="shrink-0" />
                  <span className="text-xs font-medium capitalize">{formatDate(slot.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="shrink-0" />
                  <span className="text-sm font-bold">{slot.hour}</span>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleBook}
            disabled={!selected || booking}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            {booking ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {booking ? 'Reservando…' : 'Confirmar horário'}
          </button>
        </>
      )}
    </div>
  )
}
