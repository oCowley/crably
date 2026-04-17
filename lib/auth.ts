import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { UserProfile, Role } from '@/types'

export async function createUserProfile(
  uid: string,
  email: string,
  name: string,
): Promise<UserProfile> {
  await setDoc(doc(db, 'users', uid), {
    email,
    name,
    role: 'customer' as Role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  const now = new Date()
  return { id: uid, email, name, role: 'customer', createdAt: now, updatedAt: now }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null

  const data = snap.data()
  return {
    id: snap.id,
    email: data.email,
    name: data.name,
    role: data.role,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  }
}
