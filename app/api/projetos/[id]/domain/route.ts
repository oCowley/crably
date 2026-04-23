import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

interface DomainBody {
  host: string
  user: string
  pass: string
  notes: string
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { host, user, pass, notes }: DomainBody = await req.json()

  if (!id || !host) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  await updateDoc(doc(db, 'orders', id), {
    domainHost: host,
    domainUser: user,
    domainPass: pass,
    domainNotes: notes,
    projectStage: 'aguardando_dominio',
    updatedAt: serverTimestamp(),
  })

  return NextResponse.json({ ok: true })
}
