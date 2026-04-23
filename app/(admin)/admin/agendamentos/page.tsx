'use client'

import { useState, useEffect, type FormEvent } from 'react'
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { MeetSlot } from '@/types'
import { CalendarDays, Plus, Trash2, CheckCircle2, Clock, Loader2 } from 'lucide-react'

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors'

const HOURS = [
  '08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00',
]

export default function AgendamentosPage() {
  const [slots, setSlots]           = useState<MeetSlot[]>([])
  const [loading, setLoading]       = useState(true)
  const [newDate, setNewDate]       = useState('')
  const [newHour, setNewHour]       = useState('09:00')
  const [creating, setCreating]     = useState(false)
  const [meetLinks, setMeetLinks]   = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState<string | null>(null)

  async function fetchSlots() {
    const snap = await getDocs(collection(db, 'meetSlots'))
    const rows: MeetSlot[] = snap.docs.map((d) => ({
      id: d.id,
      date: d.data().date as string,
      hour: d.data().hour as string,
      available: d.data().available as boolean,
      orderId: d.data().orderId as string | undefined,
      meetLink: d.data().meetLink as string | undefined,
    }))
    rows.sort((a, b) => `${a.date}${a.hour}`.localeCompare(`${b.date}${b.hour}`))
    setSlots(rows)
    setLoading(false)
  }

  useEffect(() => { fetchSlots() }, [])

  async function handleCreateSlot(e: FormEvent) {
    e.preventDefault()
    if (!newDate || !newHour) return
    setCreating(true)
    await addDoc(collection(db, 'meetSlots'), {
      date: newDate,
      hour: newHour,
      available: true,
      createdAt: serverTimestamp(),
    })
    setNewDate('')
    await fetchSlots()
    setCreating(false)
  }

  async function handleDelete(id: string) {
    await deleteDoc(doc(db, 'meetSlots', id))
    setSlots((prev) => prev.filter((s) => s.id !== id))
  }

  async function handleConfirmMeet(slot: MeetSlot) {
    const link = meetLinks[slot.id]
    if (!link || !slot.orderId) return
    setConfirming(slot.id)
    await Promise.all([
      updateDoc(doc(db, 'meetSlots', slot.id), {
        meetLink: link,
        updatedAt: serverTimestamp(),
      }),
      updateDoc(doc(db, 'orders', slot.orderId), {
        meetLink: link,
        meetDate: `${slot.date} ${slot.hour}`,
        projectStage: 'meet_confirmado',
        updatedAt: serverTimestamp(),
      }),
    ])
    await fetchSlots()
    setConfirming(null)
  }

  const available = slots.filter((s) => s.available && !s.orderId)
  const booked    = slots.filter((s) => !s.available || !!s.orderId)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Agendamentos</h1>
        <p className="text-neutral-500 text-sm">Gerencie horários disponíveis para o meet inicial.</p>
      </div>

      {/* Create slot */}
      <div className="bento-card p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Adicionar horário disponível</h2>
        <form onSubmit={handleCreateSlot} className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5 flex-1 min-w-[160px]">
            <label className="text-xs text-neutral-400">Data</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400">Horário</label>
            <select
              value={newHour}
              onChange={(e) => setNewHour(e.target.value)}
              className={`${inputCls} appearance-none cursor-pointer w-28`}
            >
              {HOURS.map((h) => (
                <option key={h} value={h} className="bg-[#1a1a1a]">{h}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="h-10 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Adicionar
          </button>
        </form>
      </div>

      {/* Booked slots awaiting meet link */}
      {booked.filter((s) => !s.meetLink).length > 0 && (
        <div className="bento-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Aguardando link do meet</h2>
          </div>
          <div className="divide-y divide-white/5">
            {booked.filter((s) => !s.meetLink).map((slot) => (
              <div key={slot.id} className="px-6 py-4 flex flex-wrap items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {slot.date} às {slot.hour}
                  </p>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Pedido: {slot.orderId}</p>
                </div>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={meetLinks[slot.id] ?? ''}
                  onChange={(e) => setMeetLinks((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                  className="flex-1 min-w-[220px] px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50"
                />
                <button
                  onClick={() => handleConfirmMeet(slot)}
                  disabled={!meetLinks[slot.id] || confirming === slot.id}
                  className="h-9 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  {confirming === slot.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                  Confirmar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available slots */}
      <div className="bento-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">
            Horários disponíveis ({available.length})
          </h2>
        </div>
        {loading ? (
          <div className="px-6 py-8 flex justify-center">
            <Loader2 size={20} className="animate-spin text-neutral-600" />
          </div>
        ) : available.length === 0 ? (
          <p className="px-6 py-6 text-sm text-neutral-600">Nenhum horário disponível. Adicione acima.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {available.map((slot) => (
              <div key={slot.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock size={14} className="text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{slot.date}</p>
                    <p className="text-xs text-neutral-500">{slot.hour}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(slot.id)}
                  className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-400/8 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
