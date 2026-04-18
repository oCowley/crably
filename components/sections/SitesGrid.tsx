'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X } from 'lucide-react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { createUserProfile, getUserProfile } from '@/lib/auth'
import ScrollReveal from '@/components/ui/ScrollReveal'

type SiteProduct = {
  name: string
  desc: string
  prazo: string
  tag: string
  tagHex: string
  originalPrice: string
  discountPrice: string
  bg: string
  featured?: boolean
}

const SITES: SiteProduct[] = [
  {
    name: 'Landing Page',
    desc: '1 página, até 6 seções',
    prazo: 'Entrega em 7 dias',
    tag: 'Maior desconto',
    tagHex: '#F97316',
    originalPrice: 'R$ 1.200',
    discountPrice: 'R$ 840',
    bg: 'linear-gradient(135deg, #1a0a00 0%, #2d1200 50%, #1a0800 100%)',
  },
  {
    name: 'Blog / Portal',
    desc: 'CMS + listagem + posts',
    prazo: 'Entrega em 10 dias',
    tag: 'Ótimo custo-benefício',
    tagHex: '#22c55e',
    originalPrice: 'R$ 1.800',
    discountPrice: 'R$ 1.260',
    bg: 'linear-gradient(135deg, #0d0014 0%, #1a0033 50%, #0d0014 100%)',
  },
  {
    name: 'Loja de Infoprodutos',
    desc: 'Checkout + área do aluno',
    prazo: 'Entrega em 10 dias',
    tag: 'Mais procurado',
    tagHex: '#f43f5e',
    originalPrice: 'R$ 2.200',
    discountPrice: 'R$ 1.540',
    bg: 'linear-gradient(135deg, #000d1a 0%, #001433 50%, #000a1a 100%)',
  },
  {
    name: 'Site Institucional',
    desc: 'Até 5 páginas + contato',
    prazo: 'Entrega em 14 dias',
    tag: 'Mais vendido',
    tagHex: '#F97316',
    originalPrice: 'R$ 2.800',
    discountPrice: 'R$ 1.960',
    bg: 'linear-gradient(135deg, #0a0f00 0%, #141f00 50%, #0a0f00 100%)',
    featured: true,
  },
  {
    name: 'E-commerce',
    desc: 'Catálogo + carrinho + checkout',
    prazo: 'Entrega em 14 dias',
    tag: 'Completo',
    tagHex: '#3b82f6',
    originalPrice: 'R$ 4.500',
    discountPrice: 'R$ 3.150',
    bg: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)',
  },
  {
    name: 'SaaS / App Web',
    desc: 'Auth + dashboard + lógica',
    prazo: 'Entrega em 14–21 dias',
    tag: 'Premium',
    tagHex: '#f59e0b',
    originalPrice: 'R$ 7.000',
    discountPrice: 'R$ 4.900',
    bg: 'linear-gradient(135deg, #05001a 0%, #0a0033 50%, #05001a 100%)',
  },
]

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
  'w-full h-11 px-4 rounded-xl bg-[#0B0B0B] border border-white/8 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-[#F97316]/40 focus:ring-1 focus:ring-[#F97316]/15 transition-all'

export default function SitesGrid() {
  const router = useRouter()

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function openModal(productName: string) {
    setSelectedProduct(productName)
    setMode('register')
    setName('')
    setEmail('')
    setPassword('')
    setError('')
  }

  function closeModal() {
    setSelectedProduct(null)
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
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SITES.map((t, i) => (
          <ScrollReveal key={t.name} delay={((i % 3) + 1) as 1 | 2 | 3}>
            <div
              className={`group relative rounded-2xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/50 overflow-hidden bg-dark-card cursor-pointer ${
                t.featured
                  ? 'border-[#F97316]/40 hover:border-[#F97316]/70'
                  : 'border-white/5 hover:border-white/20'
              }`}
            >
              {/* Preview area */}
              <div className="h-48 relative overflow-hidden" style={{ background: t.bg }}>
                {/* Category badge */}
                <span
                  className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-semibold border"
                  style={{
                    color: t.tagHex,
                    background: `${t.tagHex}22`,
                    borderColor: `${t.tagHex}44`,
                  }}
                >
                  {t.tag}
                </span>

                {/* Discount badge */}
                <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-[#F97316] text-white text-xs font-semibold">
                  30% OFF primeira compra
                </span>

                {/* Fake website skeleton */}
                <div className="absolute inset-0 p-5 flex flex-col justify-between opacity-50 group-hover:opacity-70 transition-opacity">
                  <div className="mt-8 space-y-2">
                    <div className="h-4 w-2/3 rounded-lg bg-white/10" />
                    <div className="h-2.5 w-full rounded bg-white/6" />
                    <div className="h-2.5 w-5/6 rounded bg-white/6" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-7 w-20 rounded-lg bg-brand/40 group-hover:bg-brand/60 transition-colors" />
                    <div className="h-7 w-14 rounded-lg bg-white/6" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((n) => (
                      <div key={n} className="h-10 rounded-lg bg-white/5" />
                    ))}
                  </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-transparent" />
              </div>

              {/* Card body */}
              <div className="p-5">
                <h3 className="font-semibold text-white text-base mb-0.5 group-hover:text-brand transition-colors">
                  {t.name}
                </h3>
                <p className="text-sm text-neutral-500 mb-1">{t.desc}</p>
                <p className="text-xs text-neutral-600 mb-4">{t.prazo}</p>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-sm text-neutral-500 line-through">{t.originalPrice}</span>
                  <span className="text-2xl font-bold text-[#F97316]">{t.discountPrice}</span>
                </div>

                <button
                  onClick={() => openModal(t.name)}
                  className="w-full h-10 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/30 transition-all duration-200 active:scale-[0.97]"
                >
                  Contratar →
                </button>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Single modal — rendered at this level, outside any card */}
      {selectedProduct !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-[#111111] border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/60 overflow-hidden">
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
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
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
                <h2 className="text-xl font-bold text-white mb-1">
                  {mode === 'register' ? 'Crie sua conta' : 'Bem-vindo de volta'}
                </h2>
                <p className="text-sm text-neutral-400">
                  {mode === 'register'
                    ? `Para contratar ${selectedProduct}, crie sua conta gratuitamente.`
                    : 'Entre para continuar com seu pedido.'}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex rounded-xl bg-white/5 p-1 mb-6">
                {(['register', 'login'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      mode === m
                        ? 'bg-brand text-white shadow-lg shadow-brand/20'
                        : 'text-neutral-400 hover:text-white'
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

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Senha</label>
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
