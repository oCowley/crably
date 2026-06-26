'use client'

import { useState, useEffect, type FormEvent } from 'react'
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { MeetSlot } from '@/types'
import {
  ChevronLeft, ChevronRight, Plus, Trash2,
  CheckCircle2, Clock, Loader2, Video, Flag,
  CalendarDays,
} from 'lucide-react'

const HOURS = [
  '08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00',
]

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

type SlotWithMeta = MeetSlot & { concluded?: boolean }

function toYMD(date: Date) {
  return date.toISOString().slice(0, 10)
}

// ─── Slot card ────────────────────────────────────────────────────────────────

function SlotCard({
  slot,
  meetLinks,
  confirming,
  concluding,
  onDelete,
  onMeetLinkChange,
  onConfirm,
  onConclude,
}: {
  slot: SlotWithMeta
  meetLinks: Record<string, string>
  confirming: string | null
  concluding: string | null
  onDelete: (id: string) => void
  onMeetLinkChange: (id: string, val: string) => void
  onConfirm: (slot: SlotWithMeta) => void
  onConclude: (slot: SlotWithMeta) => void
}) {
  const isFree      = slot.available && !slot.orderId
  const needsLink   = !!slot.orderId && !slot.meetLink
  const isConfirmed = !!slot.meetLink && !slot.concluded
  const isDone      = !!slot.concluded

  const accent = isDone
    ? { border: 'border-green-500/20', bg: 'bg-green-500/[0.06]', icon: 'bg-green-500/15 text-green-400', badge: 'text-green-400 bg-green-400/10 border-green-400/20', label: 'Concluído' }
    : isConfirmed
      ? { border: 'border-blue-500/20', bg: 'bg-blue-500/[0.06]', icon: 'bg-blue-500/15 text-blue-400', badge: 'text-blue-400 bg-blue-400/10 border-blue-400/20', label: 'Meet confirmado' }
      : needsLink
        ? { border: 'border-orange-500/20', bg: 'bg-orange-500/[0.06]', icon: 'bg-orange-500/15 text-orange-400', badge: 'text-orange-400 bg-orange-400/10 border-orange-400/20', label: 'Aguardando link' }
        : { border: 'border-white/[0.08]', bg: 'bg-white/[0.02]', icon: 'bg-brand/15 text-brand', badge: 'text-brand bg-brand/10 border-brand/20', label: 'Disponível' }

  return (
    <div className={`rounded-2xl border ${accent.border} ${accent.bg} p-4 space-y-3`}>
      {/* Top row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent.icon}`}>
            <Clock size={15} />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-none">{slot.hour}</p>
            <p className="text-[10px] text-neutral-600 mt-0.5">
              {slot.orderId ? `Pedido #${slot.orderId.slice(0, 8)}…` : 'Horário livre'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${accent.badge}`}>
            {accent.label}
          </span>
          {isFree && (
            <button
              onClick={() => onDelete(slot.id)}
              className="p-1.5 rounded-lg text-neutral-700 hover:text-red-400 hover:bg-red-400/5 transition-colors"
              aria-label="Remover horário"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Meet link input */}
      {needsLink && (
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            placeholder="meet.google.com/xxx-xxxx-xxx"
            value={meetLinks[slot.id] ?? ''}
            onChange={(e) => onMeetLinkChange(slot.id, e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-white/[0.06] border border-white/[0.10] rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors"
          />
          <button
            onClick={() => onConfirm(slot)}
            disabled={!meetLinks[slot.id] || confirming === slot.id}
            className="h-8 px-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 shrink-0"
          >
            {confirming === slot.id
              ? <Loader2 size={11} className="animate-spin" />
              : <Video size={11} />}
            Enviar
          </button>
        </div>
      )}

      {/* Confirmed: show link + conclude */}
      {isConfirmed && slot.meetLink && (
        <div className="flex items-center gap-2 pt-1">
          <a
            href={slot.meetLink.startsWith('http') ? slot.meetLink : `https://${slot.meetLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-[11px] text-blue-400 hover:underline truncate"
          >
            {slot.meetLink}
          </a>
          <button
            onClick={() => onConclude(slot)}
            disabled={concluding === slot.id}
            className="h-8 px-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-1.5 border border-green-500/20 transition-colors disabled:opacity-40 shrink-0"
          >
            {concluding === slot.id
              ? <Loader2 size={11} className="animate-spin" />
              : <Flag size={11} />}
            Concluído
          </button>
        </div>
      )}

      {/* Done state */}
      {isDone && (
        <div className="flex items-center gap-1.5 pt-1">
          <CheckCircle2 size={12} className="text-green-400" />
          <span className="text-[11px] text-green-400/70">Meet realizado com sucesso</span>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgendamentosPage() {
  const today = new Date()
  const [year, setYear]               = useState(today.getFullYear())
  const [month, setMonth]             = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(toYMD(today))
  const [slots, setSlots]             = useState<SlotWithMeta[]>([])
  const [loading, setLoading]         = useState(true)
  const [newHour, setNewHour]         = useState('09:00')
  const [creating, setCreating]       = useState(false)
  const [meetLinks, setMeetLinks]     = useState<Record<string, string>>({})
  const [confirming, setConfirming]   = useState<string | null>(null)
  const [concluding, setConcluding]   = useState<string | null>(null)

  async function fetchSlots() {
    const snap = await getDocs(collection(db, 'meetSlots'))
    const rows: SlotWithMeta[] = snap.docs.map((d) => ({
      id: d.id,
      date: d.data().date as string,
      hour: d.data().hour as string,
      available: d.data().available as boolean,
      orderId: d.data().orderId as string | undefined,
      meetLink: d.data().meetLink as string | undefined,
      concluded: d.data().concluded as boolean | undefined,
    }))
    rows.sort((a, b) => `${a.date}${a.hour}`.localeCompare(`${b.date}${b.hour}`))
    setSlots(rows)
    setLoading(false)
  }

  useEffect(() => { fetchSlots() }, [])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function calendarDays(): (string | null)[] {
    const first = new Date(year, month, 1).getDay()
    const total = new Date(year, month + 1, 0).getDate()
    const days: (string | null)[] = Array(first).fill(null)
    for (let d = 1; d <= total; d++) {
      days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
    return days
  }

  function slotsForDay(ymd: string) {
    return slots.filter(s => s.date === ymd)
  }

  function dotColor(daySlots: SlotWithMeta[]): string | null {
    if (daySlots.some(s => s.orderId && !s.meetLink)) return 'bg-orange-400'
    if (daySlots.some(s => s.meetLink && !s.concluded)) return 'bg-blue-400'
    if (daySlots.some(s => s.concluded)) return 'bg-green-500'
    if (daySlots.some(s => s.available)) return 'bg-brand'
    return null
  }

  async function handleCreateSlot(e: FormEvent) {
    e.preventDefault()
    if (!selectedDay || !newHour) return
    setCreating(true)
    await addDoc(collection(db, 'meetSlots'), {
      date: selectedDay,
      hour: newHour,
      available: true,
      createdAt: serverTimestamp(),
    })
    await fetchSlots()
    setCreating(false)
  }

  async function handleDelete(id: string) {
    await deleteDoc(doc(db, 'meetSlots', id))
    setSlots(prev => prev.filter(s => s.id !== id))
  }

  async function handleConfirmMeet(slot: SlotWithMeta) {
    const link = meetLinks[slot.id]
    if (!link || !slot.orderId) return
    setConfirming(slot.id)
    const finalLink = link.startsWith('http') ? link : `https://${link}`
    await Promise.all([
      updateDoc(doc(db, 'meetSlots', slot.id), { meetLink: finalLink, updatedAt: serverTimestamp() }),
      updateDoc(doc(db, 'orders', slot.orderId), {
        meetLink: finalLink,
        meetDate: `${slot.date} ${slot.hour}`,
        projectStage: 'meet_confirmado',
        updatedAt: serverTimestamp(),
      }),
    ])
    await fetchSlots()
    setConfirming(null)
  }

  async function handleConcludeMeet(slot: SlotWithMeta) {
    if (!slot.orderId) return
    setConcluding(slot.id)
    await Promise.all([
      updateDoc(doc(db, 'meetSlots', slot.id), { concluded: true, updatedAt: serverTimestamp() }),
      updateDoc(doc(db, 'orders', slot.orderId), {
        projectStage: 'em_desenvolvimento',
        developmentStartedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    ])
    await fetchSlots()
    setConcluding(null)
  }

  const days = calendarDays()
  const daySlots = selectedDay ? slotsForDay(selectedDay) : []
  const todayYMD = toYMD(today)

  const monthSlots = slots.filter(s => s.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
  const monthBooked = monthSlots.filter(s => s.orderId).length
  const monthFree   = monthSlots.filter(s => !s.orderId).length

  function formatDayLabel(ymd: string) {
    const [y, m, d] = ymd.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long',
    })
  }

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-medium text-neutral-600 uppercase tracking-widest">
            Agenda
          </p>
          <h1 className="text-2xl font-bold text-white mt-1">Agendamentos</h1>
        </div>

        {/* Month summary badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111111] border border-white/[0.06]">
            <CalendarDays size={13} className="text-neutral-500" />
            <span className="text-xs font-semibold text-white">{monthSlots.length}</span>
            <span className="text-xs text-neutral-600">slots em {MONTHS[month]}</span>
          </div>
          {monthBooked > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand/10 border border-brand/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              <span className="text-xs font-semibold text-brand">{monthBooked} agendados</span>
            </div>
          )}
          {monthFree > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07]">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
              <span className="text-xs text-neutral-500">{monthFree} livres</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">

        {/* ── Calendário ──────────────────────────────────────── */}
        <div className="rounded-2xl bg-[#111111] border border-white/[0.06] p-6">

          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-base font-bold text-white">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[10px] font-semibold text-neutral-700 py-1 uppercase tracking-wide">
                {w}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((ymd, i) => {
              if (!ymd) return <div key={i} />
              const ds = slotsForDay(ymd)
              const dot = dotColor(ds)
              const isToday    = ymd === todayYMD
              const isSelected = ymd === selectedDay
              const isPast     = ymd < todayYMD

              return (
                <button
                  key={ymd}
                  onClick={() => setSelectedDay(ymd)}
                  className={[
                    'relative flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 transition-all duration-150 text-sm font-semibold',
                    isSelected
                      ? 'bg-brand text-white shadow-lg shadow-brand/25'
                      : isToday
                        ? 'ring-1 ring-brand/50 bg-brand/10 text-white'
                        : isPast
                          ? 'text-neutral-700 hover:text-neutral-400 hover:bg-white/[0.04]'
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]',
                  ].join(' ')}
                >
                  {ymd.slice(8)}
                  {dot && (
                    <span
                      className={`w-1 h-1 rounded-full transition-colors ${isSelected ? 'bg-white/70' : dot}`}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 pt-4 border-t border-white/[0.05]">
            {[
              { color: 'bg-brand',      label: 'Disponível' },
              { color: 'bg-orange-400', label: 'Aguardando link' },
              { color: 'bg-blue-400',   label: 'Confirmado' },
              { color: 'bg-green-500',  label: 'Concluído' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                <span className="text-[10px] text-neutral-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Painel do dia ───────────────────────────────────── */}
        <div className="rounded-2xl bg-[#111111] border border-white/[0.06] flex flex-col overflow-hidden">

          {selectedDay ? (
            <>
              {/* Day header */}
              <div className="px-5 py-4 border-b border-white/[0.05] shrink-0">
                <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
                  Horários do dia
                </p>
                <p className="text-sm font-bold text-white mt-1 capitalize">
                  {formatDayLabel(selectedDay)}
                </p>
              </div>

              {/* Add slot form */}
              <form
                onSubmit={handleCreateSlot}
                className="px-5 py-3.5 border-b border-white/[0.05] flex gap-2 shrink-0"
              >
                <select
                  value={newHour}
                  onChange={(e) => setNewHour(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-white/[0.05] border border-white/[0.09] rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-brand/50 transition-colors"
                >
                  {HOURS.map(h => (
                    <option key={h} value={h} className="bg-[#1a1a1a]">{h}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={creating}
                  className="h-10 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                >
                  {creating
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Plus size={14} />}
                  Adicionar
                </button>
              </form>

              {/* Slots list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={20} className="animate-spin text-neutral-700" />
                  </div>
                ) : daySlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                      <Clock size={18} className="text-neutral-700" />
                    </div>
                    <p className="text-sm text-neutral-600">Nenhum horário neste dia.</p>
                    <p className="text-xs text-neutral-700">Use o formulário acima para adicionar.</p>
                  </div>
                ) : (
                  daySlots.map(slot => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      meetLinks={meetLinks}
                      confirming={confirming}
                      concluding={concluding}
                      onDelete={handleDelete}
                      onMeetLinkChange={(id, val) =>
                        setMeetLinks(prev => ({ ...prev, [id]: val }))
                      }
                      onConfirm={handleConfirmMeet}
                      onConclude={handleConcludeMeet}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                <CalendarDays size={22} className="text-neutral-700" />
              </div>
              <p className="text-sm text-neutral-500">Selecione um dia no calendário</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
