import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

interface BriefingBody {
  notes: string
  references: string[]
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { notes, references }: BriefingBody = await req.json()

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const refs = references.filter(Boolean).slice(0, 5)

  await updateDoc(doc(db, 'orders', id), {
    briefingNotes: notes,
    references: refs,
    projectStage: 'agendamento',
    updatedAt: serverTimestamp(),
  })

  return NextResponse.json({ ok: true })
}
