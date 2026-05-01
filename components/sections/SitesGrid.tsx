'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Flame, Zap, TrendingUp, Award, Star, Sparkles, Target, Users, BarChart3, ShoppingCart, Globe, Brush, Layout, Rocket, Eye, FileText, Building2, BookOpen, DollarSign } from 'lucide-react'
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

const fmt = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

const discountedPrice = (cents: number) => Math.round(cents * 0.7)

type Tag = { label: string; icon: typeof Zap; color: string; bg: string }

// ── Tags contextuais por tipo de produto ──
// Cada produto tem combinação ÚNICA de labels + cores + ícones. Zero repetição.
const TAG_MAP: { keywords: string[]; featured: boolean; tags: Tag[] }[] = [
  {
    keywords: ['landing'],
    featured: true,
    tags: [
      { label: 'Para negócios locais', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
      { label: 'Captura leads 24h', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
      { label: '#1 entre profissionais', icon: TrendingUp, color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20' },
    ],
  },
  {
    keywords: ['saas', 'app web'],
    featured: true,
    tags: [
      { label: 'Para startups', icon: Rocket, color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20' },
      { label: 'Login + painel inclusos', icon: Layout, color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20' },
      { label: 'Escolha de 12+ startups', icon: Users, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
    ],
  },
  {
    keywords: ['portf', 'portfolio', 'portfólio'],
    featured: false,
    tags: [
      { label: 'Para criativos e agências', icon: Brush, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10 border-fuchsia-400/20' },
      { label: 'Impressione clientes', icon: Eye, color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20' },
    ],
  },
  {
    keywords: ['info produto', 'infoproduto', 'info-produto'],
    featured: false,
    tags: [
      { label: 'Para infoprodutores', icon: BookOpen, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
      { label: 'Venda no automático', icon: DollarSign, color: 'text-lime-400', bg: 'bg-lime-400/10 border-lime-400/20' },
    ],
  },
  {
    keywords: ['ecommerce', 'e-commerce', 'loja'],
    featured: false,
    tags: [
      { label: 'Para lojas online', icon: ShoppingCart, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
      { label: 'Checkout integrado', icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
    ],
  },
  {
    keywords: ['blog', 'portal', 'conteúdo', 'conteudo'],
    featured: false,
    tags: [
      { label: 'Para criadores de conteúdo', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20' },
      { label: 'SEO otimizado', icon: BarChart3, color: 'text-teal-400', bg: 'bg-teal-400/10 border-teal-400/20' },
    ],
  },
  {
    keywords: ['institucional', 'empresa', 'corporat'],
    featured: false,
    tags: [
      { label: 'Para empresas', icon: Building2, color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/20' },
      { label: 'Credibilidade online', icon: Globe, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
    ],
  },
]

const FALLBACK_TAGS: Tag[] = [
  { label: 'Site profissional', icon: Star, color: 'text-neutral-300', bg: 'bg-neutral-300/10 border-neutral-300/20' },
]

function getProductMeta(name: string) {
  const lower = name.toLowerCase()
  const match = TAG_MAP.find((entry) => entry.keywords.some((kw) => lower.includes(kw)))
  return {
    featured: match?.featured ?? false,
    tags: match?.tags ?? FALLBACK_TAGS,
  }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-dark-card overflow-hidden animate-pulse">
            <div className="aspect-[16/10] bg-white/5" />
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

  // Sort: featured first, then rest
  const sorted = [...products].sort((a, b) => {
    const aF = getProductMeta(a.name).featured ? 0 : 1
    const bF = getProductMeta(b.name).featured ? 0 : 1
    return aF - bF
  })

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sorted.map((product, i) => {
          const meta = getProductMeta(product.name)

          return (
            <ScrollReveal key={product.id} delay={((i % 3) + 1) as 1 | 2 | 3} className="flex">
              <div
                className={`group relative rounded-2xl bg-dark-card cursor-pointer transition-all duration-300 lg:hover:-translate-y-1.5 lg:hover:z-30 flex flex-col w-full ${
                  meta.featured
                    ? 'border border-brand/20 lg:hover:border-brand/40 lg:hover:shadow-brand/15 featured-card'
                    : 'border border-white/5 lg:hover:border-white/15 lg:hover:shadow-black/40'
                }`}
              >
                {/* ── Discount badge (sobre a imagem, canto direito) ── */}
                <div className="absolute top-3 right-3 z-20 discount-badge">
                  <div className="discount-shimmer text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                    <Flame size={11} className="shrink-0" />
                    −30%
                  </div>
                </div>

                {/* ── Preview (clipped) ── */}
                <div className="aspect-[16/10] relative overflow-hidden bg-[#0d0d0d] rounded-t-2xl">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover object-top sm:group-hover:object-bottom sm:group-hover:scale-110 transition-[object-position,transform] duration-[3s] ease-in-out"
                    />
                  ) : (
                    <div className="absolute inset-0 p-5 flex flex-col justify-between opacity-30 group-hover:opacity-50 transition-opacity" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
                      <div className="mt-8 space-y-2">
                        <div className="h-4 w-2/3 rounded-lg bg-white/10" />
                        <div className="h-2.5 w-full rounded bg-white/6" />
                        <div className="h-2.5 w-5/6 rounded bg-white/6" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-7 w-20 rounded-lg bg-brand/30" />
                        <div className="h-7 w-14 rounded-lg bg-white/6" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-transparent opacity-60 lg:group-hover:opacity-20 transition-opacity duration-500" />
                </div>

                {/* ── Floating expanded image on hover (desktop only) ── */}
                {product.images?.[0] && (
                  <div className="hidden lg:block absolute inset-x-[-12px] top-[-12px] z-30 rounded-2xl overflow-hidden shadow-2xl shadow-black/90 border border-white/10 opacity-0 invisible scale-95 group-hover:opacity-100 group-hover:visible group-hover:scale-100 transition-all duration-500 ease-out pointer-events-none origin-top max-h-[70vh] overflow-y-auto">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full"
                    />
                  </div>
                )}

                {/* ── Body ── */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Destaque label + contextual tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {meta.featured && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-brand/10 border-brand/25 text-brand">
                        <Sparkles size={10} />
                        Destaque
                      </div>
                    )}
                    {meta.tags.map((tag, ti) => (
                      <div key={ti} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${tag.bg} ${tag.color}`}>
                        <tag.icon size={10} />
                        {tag.label}
                      </div>
                    ))}
                  </div>

                  <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-brand transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-neutral-500 mb-4 line-clamp-2 leading-relaxed flex-1">{product.description}</p>

                  {/* Pricing */}
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-xl font-bold text-[#F97316]">
                      {fmt(discountedPrice(product.price))}
                    </span>
                    <span className="price-slash text-xs text-neutral-600 font-medium">
                      {fmt(product.price)}
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-[11px] text-green-400 font-medium mb-4">
                    <Zap size={10} />
                    1ª compra com 30% off
                  </p>

                  <button
                    onClick={() => openModal(product.name)}
                    className={`w-full h-9 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-all duration-200 active:scale-[0.97] ${
                      meta.featured
                        ? 'lg:hover:shadow-lg lg:hover:shadow-brand/30 glow-brand-sm'
                        : 'lg:hover:shadow-md lg:hover:shadow-brand/20'
                    }`}
                  >
                    Contratar →
                  </button>
                </div>
              </div>
            </ScrollReveal>
          )
        })}
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
