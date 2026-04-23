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
} from 'lucide-react'

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors'

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

export default function AgendamentosPage() {
  const today = new Date()
  const [year, setYear]           = useState(today.getFullYear())
  const [month, setMonth]         = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(toYMD(today))
  const [slots, setSlots]         = useState<SlotWithMeta[]>([])
  const [loading, setLoading]     = useState(true)
  const [newHour, setNewHour]     = useState('09:00')
  const [creating, setCreating]   = useState(false)
  const [meetLinks, setMeetLinks] = useState<Record<string, string>>({})
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

  /* ── Calendar helpers ─────────────────────────────────── */

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

  function dotColor(daySlots: SlotWithMeta[]) {
    if (daySlots.some(s => s.orderId && !s.meetLink)) return 'bg-orange-400'
    if (daySlots.some(s => s.meetLink && !s.concluded)) return 'bg-blue-400'
    if (daySlots.some(s => s.concluded)) return 'bg-green-500'
    if (daySlots.some(s => s.available)) return 'bg-brand'
    return null
  }

  /* ── Actions ──────────────────────────────────────────── */

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
      updateDoc(doc(db, 'meetSlots', slot.id), {
        meetLink: finalLink,
        updatedAt: serverTimestamp(),
      }),
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
      updateDoc(doc(db, 'meetSlots', slot.id), {
        concluded: true,
        updatedAt: serverTimestamp(),
      }),
      updateDoc(doc(db, 'orders', slot.orderId), {
        projectStage: 'em_desenvolvimento',
        developmentStartedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    ])
    await fetchSlots()
    setConcluding(null)
  }

  /* ── Render ───────────────────────────────────────────── */

  const days = calendarDays()
  const daySlots = selectedDay ? slotsForDay(selectedDay) : []

  function formatDayLabel(ymd: string) {
    const [y, m, d] = ymd.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Agendamentos</h1>
        <p className="text-neutral-500 text-sm">Gerencie horários disponíveis e acompanhe os meets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* ── Calendário ──────────────────────────────── */}
        <div className="bento-card p-6">
          {/* Nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-white">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map(w => (
              <div key={w} className="text-center text-[10px] font-semibold text-neutral-600 py-1">{w}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((ymd, i) => {
              if (!ymd) return <div key={i} />
              const ds = slotsForDay(ymd)
              const dot = dotColor(ds)
              const isToday = ymd === toYMD(today)
              const isSelected = ymd === selectedDay

              return (
                <button
                  key={ymd}
                  onClick={() => setSelectedDay(ymd)}
                  className={`relative flex flex-col items-center justify-center rounded-xl py-2 transition-all text-sm font-medium ${
                    isSelected
                      ? 'bg-brand text-white'
                      : isToday
                        ? 'bg-white/10 text-white'
                        : 'hover:bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  {ymd.slice(8)}
                  {dot && (
                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : dot}`} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/5">
            {[
              { color: 'bg-brand',      label: 'Disponível' },
              { color: 'bg-orange-400', label: 'Aguardando link' },
              { color: 'bg-blue-400',   label: 'Meet confirmado' },
              { color: 'bg-green-500',  label: 'Concluído' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-[10px] text-neutral-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Painel do dia ───────────────────────────── */}
        <div className="bento-card p-5 flex flex-col gap-4">
          {selectedDay ? (
            <>
              <div>
                <p className="text-xs text-neutral-500 capitalize">{formatDayLabel(selectedDay)}</p>
                <h3 className="text-sm font-semibold text-white mt-0.5">Horários do dia</h3>
              </div>

              {/* Add slot */}
              <form onSubmit={handleCreateSlot} className="flex gap-2">
                <select
                  value={newHour}
                  onChange={(e) => setNewHour(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-brand/50"
                >
                  {HOURS.map(h => (
                    <option key={h} value={h} className="bg-[#1a1a1a]">{h}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={creating}
                  className="h-9 px-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={13} />}
                  Adicionar
                </button>
              </form>

              {/* Slots list */}
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={18} className="animate-spin text-neutral-600" />
                </div>
              ) : daySlots.length === 0 ? (
                <p className="text-xs text-neutral-600 text-center py-4">Nenhum horário neste dia.</p>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[460px] pr-0.5">
                  {daySlots.map(slot => {
                    const isFree       = slot.available && !slot.orderId
                    const needsLink    = slot.orderId && !slot.meetLink
                    const isConfirmed  = !!slot.meetLink && !slot.concluded
                    const isDone       = !!slot.concluded

                    return (
                      <div
                        key={slot.id}
                        className={`rounded-xl border p-3 space-y-2.5 ${
                          isDone       ? 'border-green-500/20 bg-green-500/5' :
                          isConfirmed  ? 'border-blue-500/20 bg-blue-500/5' :
                          needsLink    ? 'border-orange-500/20 bg-orange-500/5' :
                                        'border-white/8 bg-white/[0.02]'
                        }`}
                      >
                        {/* Hour + status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock size={13} className={
                              isDone ? 'text-green-400' :
                              isConfirmed ? 'text-blue-400' :
                              needsLink ? 'text-orange-400' :
                              'text-neutral-500'
                            } />
                            <span className="text-sm font-bold text-white">{slot.hour}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isFree && (
                              <span className="text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">Disponível</span>
                            )}
                            {needsLink && (
                              <span className="text-[10px] font-semibold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">Aguardando link</span>
                            )}
                            {isConfirmed && (
                              <span className="text-[10px] font-semibold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">Confirmado</span>
                            )}
                            {isDone && (
                              <span className="text-[10px] font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Concluído</span>
                            )}
                            {isFree && (
                              <button
                                onClick={() => handleDelete(slot.id)}
                                className="p-1 text-neutral-600 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Order ID */}
                        {slot.orderId && (
                          <p className="text-[10px] text-neutral-600 font-mono truncate">
                            Pedido: {slot.orderId}
                          </p>
                        )}

                        {/* Meet link input (needs link state) */}
                        {needsLink && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="meet.google.com/xxx-xxxx-xxx"
                              value={meetLinks[slot.id] ?? ''}
                              onChange={(e) => setMeetLinks(prev => ({ ...prev, [slot.id]: e.target.value }))}
                              className="flex-1 px-2.5 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50"
                            />
                            <button
                              onClick={() => handleConfirmMeet(slot)}
                              disabled={!meetLinks[slot.id] || confirming === slot.id}
                              className="h-7 px-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-40"
                            >
                              {confirming === slot.id ? <Loader2 size={10} className="animate-spin" /> : <Video size={10} />}
                              Enviar
                            </button>
                          </div>
                        )}

                        {/* Meet link display (confirmed) */}
                        {isConfirmed && slot.meetLink && (
                          <div className="flex items-center justify-between">
                            <a
                              href={slot.meetLink.startsWith('http') ? slot.meetLink : `https://${slot.meetLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-400 hover:underline truncate max-w-[160px]"
                            >
                              {slot.meetLink}
                            </a>
                            <button
                              onClick={() => handleConcludeMeet(slot)}
                              disabled={concluding === slot.id}
                              className="h-7 px-2.5 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 text-[11px] font-semibold flex items-center gap-1 border border-green-500/20 transition-colors disabled:opacity-40 shrink-0 ml-2"
                            >
                              {concluding === slot.id ? <Loader2 size={10} className="animate-spin" /> : <Flag size={10} />}
                              Meet concluído
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-neutral-600 text-center py-8">
              Selecione um dia no calendário.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
