'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { Eye, EyeOff } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { createUserProfile, getUserProfile } from '@/lib/auth'
import Button from '@/components/ui/Button'

const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'E-mail já cadastrado.',
  'auth/weak-password': 'Senha fraca. Use pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
  'auth/invalid-email': 'E-mail inválido.',
}

type StrengthLevel = { score: number; label: string; color: string }

function getPasswordStrength(pwd: string): StrengthLevel {
  if (!pwd) return { score: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++

  if (score <= 1) return { score: 1, label: 'Muito fraca', color: 'bg-red-500' }
  if (score === 2) return { score: 2, label: 'Fraca', color: 'bg-orange-500' }
  if (score === 3) return { score: 3, label: 'Razoável', color: 'bg-yellow-400' }
  if (score === 4) return { score: 4, label: 'Forte', color: 'bg-green-400' }
  return { score: 5, label: 'Muito forte', color: 'bg-green-500' }
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])
  const passwordsMatch = confirmPassword === '' || password === confirmPassword

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'register' && password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email)
        setResetSent(true)
        setLoading(false)
        return
      }

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

  function switchMode(next: 'login' | 'register' | 'reset') {
    setMode(next)
    setError('')
    setResetSent(false)
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirm(false)
  }

  const inputCls = "w-full h-11 px-4 rounded-xl bg-dark-elevated border border-white/8 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/15 transition-all"

  return (
    <div className="w-full max-w-md">
      <div className="relative bg-dark-card border border-white/6 rounded-2xl p-8 overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.08) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-10 h-10">
              <Image src="/images/icone-crably.png" alt="Crably" width={40} height={40} className="rounded-xl shadow-lg shadow-brand/30" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {mode === 'login' && 'Bem-vindo de volta'}
              {mode === 'register' && 'Crie sua conta'}
              {mode === 'reset' && 'Recuperar senha'}
            </h1>
            <p className="text-sm text-neutral-400">
              {mode === 'login' && 'Entre para acompanhar seus pedidos e projetos.'}
              {mode === 'register' && 'Comece a usar a Crably hoje.'}
              {mode === 'reset' && 'Enviaremos um link para redefinir sua senha.'}
            </p>
          </div>

          {/* Reset success state */}
          {resetSent ? (
            <div className="space-y-4">
              <div className="px-4 py-3 rounded-xl bg-green-500/8 border border-green-500/20 text-green-400 text-sm text-center">
                Link enviado! Verifique sua caixa de entrada.
              </div>
              <button
                onClick={() => switchMode('login')}
                className="w-full text-sm text-brand hover:text-brand-hover transition-colors font-medium"
              >
                Voltar para o login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Nome</label>
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
                <label className="block text-sm font-medium text-neutral-300 mb-2">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="voce@email.com"
                  className={inputCls}
                />
              </div>

              {mode !== 'reset' && (
                <div className="space-y-3">
                  {/* Senha */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-neutral-300">Senha</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchMode('reset')}
                          className="text-xs text-neutral-500 hover:text-brand transition-colors"
                        >
                          Esqueceu a senha?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        minLength={6}
                        className={`${inputCls} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Indicador de força — só no cadastro */}
                    {mode === 'register' && password.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i <= strength.score ? strength.color : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-neutral-500">
                          Força: <span className={`font-medium ${
                            strength.score <= 2 ? 'text-red-400' :
                            strength.score === 3 ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>{strength.label}</span>
                          <span className="ml-2 text-neutral-600">
                            {strength.score < 3 && '· Use maiúsculas, números e símbolos'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirmar senha — só no cadastro */}
                  {mode === 'register' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">Confirmar senha</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className={`${inputCls} pr-11 ${
                            !passwordsMatch ? 'border-red-500/40 focus:border-red-500/60' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                        >
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {!passwordsMatch && (
                        <p className="mt-1.5 text-xs text-red-400">As senhas não coincidem.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2 glow-brand-sm"
                disabled={loading || (mode === 'register' && !passwordsMatch)}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Carregando...
                  </span>
                ) : (
                  <>
                    {mode === 'login' && 'Entrar'}
                    {mode === 'register' && 'Criar conta'}
                    {mode === 'reset' && 'Enviar link de recuperação'}
                  </>
                )}
              </Button>

              <div className="mt-2 text-center">
                {mode === 'reset' ? (
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-sm text-neutral-500 hover:text-brand transition-colors"
                  >
                    Voltar para o login
                  </button>
                ) : (
                  <p className="text-sm text-neutral-500">
                    {mode === 'login' ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
                    <button
                      type="button"
                      onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                      className="text-brand hover:text-brand-hover transition-colors font-medium"
                    >
                      {mode === 'login' ? 'Criar agora' : 'Entrar'}
                    </button>
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-neutral-600 mt-6">
        Ao continuar, você concorda com nossos{' '}
        <Link href="#" className="text-neutral-400 hover:text-white transition-colors">
          Termos de Serviço
        </Link>
      </p>
    </div>
  )
}
