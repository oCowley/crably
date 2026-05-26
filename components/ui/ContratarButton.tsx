'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X } from 'lucide-react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { createUserProfile, getUserProfile } from '@/lib/auth'

const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'E-mail já cadastrado.',
  'auth/weak-password': 'Senha fraca. Use pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
  'auth/invalid-email': 'E-mail inválido.',
}

type Mode = 'register' | 'login'

const inputCls =
  'w-full h-11 px-4 rounded-xl bg-background border border-border text-foreground placeholder-muted text-sm focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/15 transition-all'

export default function ContratarButton({ productName }: { productName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function openModal() {
    setOpen(true)
    setMode('register')
    reset()
  }

  function closeModal() {
    setOpen(false)
    reset()
  }

  function reset() {
    setName('')
    setEmail('')
    setPassword('')
    setError('')
    setLoading(false)
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        const { user } = await createUserWithEmailAndPassword(auth, email, password)
        await createUserProfile(user.uid, email, name.trim())
        router.push('/dashboard')
      } else {
        const { user } = await signInWithEmailAndPassword(auth, email, password)
        const profile = await getUserProfile(user.uid)
        const isStaff = profile?.role === 'admin' || profile?.role === 'developer'
        router.push(isStaff ? '/admin' : '/dashboard')
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(ERROR_MESSAGES[code] ?? 'Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="w-full h-10 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/30 transition-all duration-200 active:scale-[0.97]"
      >
        Contratar →
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl shadow-black/10 dark:shadow-black/60 overflow-hidden">
            {/* Ambient glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(249,115,22,0.08) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {/* Close */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-elevated transition-colors"
            >
              <X size={18} />
            </button>

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto mb-3 w-10 h-10">
                  <Image
                    src="/images/icone-crably.png"
                    alt="Crably"
                    width={40}
                    height={40}
                    className="rounded-xl shadow-lg shadow-brand/30"
                  />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  {mode === 'register' ? 'Crie sua conta' : 'Bem-vindo de volta'}
                </h2>
                <p className="text-sm text-secondary">
                  {mode === 'register'
                    ? `Para contratar ${productName}, crie sua conta gratuitamente.`
                    : 'Entre para continuar com seu pedido.'}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex rounded-xl bg-elevated p-1 mb-6">
                {(['register', 'login'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      mode === m
                        ? 'bg-brand text-white shadow-lg shadow-brand/20'
                        : 'text-secondary hover:text-foreground'
                    }`}
                  >
                    {m === 'register' ? 'Criar conta' : 'Já tenho conta'}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Seu nome"
                      className={inputCls}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="voce@email.com"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-brand/20 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Carregando...
                    </span>
                  ) : mode === 'register' ? (
                    'Criar conta e contratar'
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
