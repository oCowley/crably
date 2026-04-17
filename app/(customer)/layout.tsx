'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AuthGuard from '@/components/auth/AuthGuard'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col">
        <header className="border-b border-white/5 bg-dark-card/50 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="font-bold text-white tracking-tight">cowly</span>
            </Link>
            <nav className="flex items-center gap-6">
              {profile?.name && (
                <span className="text-sm text-neutral-500">{profile.name}</span>
              )}
              <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-white transition-colors">
                Meus pedidos
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                Sair
              </button>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
