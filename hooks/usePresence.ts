'use client'

import { useEffect } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export function usePresence() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const ref = doc(db, 'presence', user.uid)

    function setOnline() {
      setDoc(ref, { isOnline: true, lastSeen: serverTimestamp() }, { merge: true })
    }

    function setOffline() {
      setDoc(ref, { isOnline: false, lastSeen: serverTimestamp() }, { merge: true })
    }

    setOnline()
    const interval = setInterval(setOnline, 30_000)
    window.addEventListener('beforeunload', setOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', setOffline)
      setOffline()
    }
  }, [user])
}
