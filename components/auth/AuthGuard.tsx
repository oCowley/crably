'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import type { Role } from '@/types'

interface Props {
  children: React.ReactNode
  allowedRoles?: Role[]
}

export default function AuthGuard({ children, allowedRoles }: Props) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
      router.replace('/dashboard')
    }
  }, [user, profile, loading, allowedRoles, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return null
  }

  return <>{children}</>
}
