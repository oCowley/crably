'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import AuthForm from './AuthForm'

interface AuthModalProps {
  initialMode?: 'login' | 'register'
  subtitle?: string
  onClose: () => void
  onSuccess: (info: { isStaff: boolean }) => void
}

export default function AuthModal({ initialMode = 'register', subtitle, onClose, onSuccess }: AuthModalProps) {
  // ESC fecha o modal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Trava o scroll da página enquanto o modal está aberto
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-overlay backdrop-blur-md" onClick={onClose} />

      <div className="animate-pop-in relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-surface border border-border p-8 shadow-2xl shadow-black/10 dark:shadow-black/60">
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(var(--brand-rgb),0.08) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 z-20 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-elevated transition-colors"
        >
          <X size={18} />
        </button>

        <div className="relative z-10">
          <AuthForm initialMode={initialMode} subtitle={subtitle} onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  )
}
