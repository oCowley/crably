'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X } from 'lucide-react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { createUserProfile, getUserProfile } from '@/lib/auth'
import ScrollReveal from '@/components/ui/ScrollReveal'

type Product = {
  id: string
  name: string
  slug: string
  price: number
  description: string
  images: string[]
}

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

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'products'), orderBy('name')))
      .then((snap) => {
        const list: Product[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, 'id'>),
        }))
        setProducts(list)
      })
      .finally(() => setLoadingProducts(false))
  }, [])

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

  if (loadingProducts) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-dark-card overflow-hidden animate-pulse">
            <div className="h-48 bg-white/5" />
            <div className="p-5 space-y-3">
              <div className="h-4 w-1/2 rounded bg-white/8" />
              <div className="h-3 w-3/4 rounded bg-white/5" />
              <div className="h-8 w-full rounded-xl bg-white/5 mt-4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, i) => (
          <ScrollReveal key={product.id} delay={((i % 3) + 1) as 1 | 2 | 3}>
            <div className="group relative rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/50 overflow-hidden bg-dark-card cursor-pointer">
              {/* Preview area */}
              <div className="h-48 relative overflow-hidden bg-[#0d0d0d]">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 p-5 flex flex-col justify-between opacity-40 group-hover:opacity-60 transition-opacity" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
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
                )}

                {/* Bottom fade */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-transparent" />
              </div>

              {/* Card body */}
              <div className="p-5">
                <h3 className="font-semibold text-white text-base mb-1 group-hover:text-brand transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm text-neutral-500 mb-4 line-clamp-2">{product.description}</p>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold text-[#F97316]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price / 100)}
                  </span>
                </div>

                <button
                  onClick={() => openModal(product.name)}
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
          <div className="relative w-full max-w-md mx-4 sm:mx-auto bg-[#111111] border border-white/8 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 overflow-hidden">
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
