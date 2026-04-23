import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { domainName } = await req.json() as { domainName: string }

  if (!id || !domainName?.trim()) {
    return NextResponse.json({ error: 'Missing domainName' }, { status: 400 })
  }

  await updateDoc(doc(db, 'orders', id), {
    domainName: domainName.trim(),
    projectStage: 'aguardando_dominio',
    updatedAt: serverTimestamp(),
  })

  return NextResponse.json({ ok: true })
}
