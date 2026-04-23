import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

interface SlotBody {
  slotId: string
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { slotId }: SlotBody = await req.json()

  if (!id || !slotId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  await Promise.all([
    updateDoc(doc(db, 'meetSlots', slotId), {
      available: false,
      orderId: id,
      updatedAt: serverTimestamp(),
    }),
    updateDoc(doc(db, 'orders', id), {
      meetSlotId: slotId,
      projectStage: 'agendamento',
      updatedAt: serverTimestamp(),
    }),
  ])

  return NextResponse.json({ ok: true })
}
