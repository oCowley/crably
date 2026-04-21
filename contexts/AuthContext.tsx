'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, type User as FirebaseUser, reload } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserProfile } from '@/lib/auth'
import type { UserProfile } from '@/types'
//.
interface AuthContextValue {
  user: FirebaseUser | null
  profile: UserProfile | null
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const prof = await getUserProfile(firebaseUser.uid)
        setProfile(prof)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function logout() {
    await signOut(auth)
  }

  async function refreshUser() {
    if (!auth.currentUser) return
    await reload(auth.currentUser)
    setUser({ ...auth.currentUser })
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
