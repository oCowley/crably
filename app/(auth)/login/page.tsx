'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthForm from '@/components/auth/AuthForm'

export default function LoginPage() {
  const router = useRouter()
  // Lido no cliente via window.location para evitar boundary de Suspense do useSearchParams
  const [initialMode, setInitialMode] = useState<'login' | 'register' | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setInitialMode(params.get('mode') === 'register' ? 'register' : 'login')
  }, [])

  function handleSuccess({ isStaff }: { isStaff: boolean }) {
    if (isStaff) {
      router.push('/admin')
      return
    }
    const redirect = new URLSearchParams(window.location.search).get('redirect')
    router.push(redirect && redirect.startsWith('/') ? redirect : '/dashboard')
  }

  return (
    <div className="w-full max-w-md">
      <div className="relative bg-surface border border-border rounded-2xl p-8 overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(var(--brand-rgb),0.08) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        <div className="relative z-10 min-h-[380px]">
          {initialMode && <AuthForm initialMode={initialMode} onSuccess={handleSuccess} />}
        </div>
      </div>

      <p className="text-center text-xs text-faint mt-6">
        Ao continuar, você concorda com nossos{' '}
        <Link href="/termos" className="text-secondary hover:text-foreground transition-colors">
          Termos de Serviço
        </Link>
      </p>
    </div>
  )
}
