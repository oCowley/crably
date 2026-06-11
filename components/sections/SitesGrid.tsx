'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, MessageCircle, Flame, Zap, TrendingUp, Award, Star, Sparkles, Target, Users, BarChart3, ShoppingCart, Globe, Brush, Layout, Rocket, Eye, FileText, Building2, BookOpen, DollarSign } from 'lucide-react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
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

const TAG_MAP: { keywords: string[]; featured: boolean; category: string; tags: Tag[] }[] = [
  {
    keywords: ['landing'],
    featured: true,
    category: 'Landing Page',
    tags: [
      { label: 'Para negocios locais', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
      { label: 'Captura leads 24h', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
      { label: '#1 entre profissionais', icon: TrendingUp, color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20' },
    ],
  },
  {
    keywords: ['saas', 'app web'],
    featured: true,
    category: 'SaaS',
    tags: [
      { label: 'Para startups', icon: Rocket, color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20' },
      { label: 'Login + painel inclusos', icon: Layout, color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20' },
      { label: 'Escolha de 12+ startups', icon: Users, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
    ],
  },
  {
    keywords: ['portf', 'portfolio', 'portfolio'],
    featured: false,
    category: 'Portfolio',
    tags: [
      { label: 'Para criativos e agencias', icon: Brush, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10 border-fuchsia-400/20' },
      { label: 'Impressione clientes', icon: Eye, color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20' },
    ],
  },
  {
    keywords: ['info produto', 'infoproduto', 'info-produto'],
    featured: false,
    category: 'E-commerce',
    tags: [
      { label: 'Para infoprodutores', icon: BookOpen, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
      { label: 'Venda no automatico', icon: DollarSign, color: 'text-lime-400', bg: 'bg-lime-400/10 border-lime-400/20' },
    ],
  },
  {
    keywords: ['ecommerce', 'e-commerce', 'loja'],
    featured: false,
    category: 'E-commerce',
    tags: [
      { label: 'Para lojas online', icon: ShoppingCart, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
      { label: 'Checkout integrado', icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
    ],
  },
  {
    keywords: ['blog', 'portal', 'conteudo', 'conteudo'],
    featured: false,
    category: 'Blog / Portal',
    tags: [
      { label: 'Para criadores de conteudo', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20' },
      { label: 'SEO otimizado', icon: BarChart3, color: 'text-teal-400', bg: 'bg-teal-400/10 border-teal-400/20' },
    ],
  },
  {
    keywords: ['institucional', 'empresa', 'corporat'],
    featured: false,
    category: 'Institucional',
    tags: [
      { label: 'Para empresas', icon: Building2, color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/20' },
      { label: 'Credibilidade online', icon: Globe, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
    ],
  },
  {
    keywords: ['pagina de vendas', 'vendas', 'venda', 'vsl', 'sales'],
    featured: false,
    category: 'Página de Vendas',
    tags: [
      { label: 'Foco em conversao', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
      { label: 'Ideal para ofertas', icon: DollarSign, color: 'text-lime-400', bg: 'bg-lime-400/10 border-lime-400/20' },
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
    category: match?.category ?? 'Outros',
    tags: match?.tags ?? FALLBACK_TAGS,
  }
}

const FILTER_CATEGORIES = ['Todos', 'Institucional', 'Landing Page', 'Página de Vendas', 'E-commerce', 'Blog / Portal']

const HELP_FILTER = 'Não sei qual escolher'

// TODO: trocar pelo número real (placeholder herdado do Footer)
const WHATSAPP_NUMBER = '5511999999999'
const WHATSAPP_HELP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Olá! Não sei qual modelo de site escolher, podem me ajudar?',
)}`

// Lista genérica de entregáveis por categoria (não há dados por produto ainda)
const CATEGORY_FEATURES: Record<string, string[]> = {
  'Landing Page': ['Página única profissional', 'Formulário ou botão de WhatsApp', 'Design responsivo', 'Entrega em até 14 dias úteis'],
  'Institucional': ['Páginas institucionais (sobre, serviços, contato)', 'Formulário de contato', 'Design responsivo', 'Entrega em até 14 dias úteis'],
  'Página de Vendas': ['Página focada em conversão', 'Seções de oferta e prova social', 'Botão de compra ou WhatsApp', 'Entrega em até 14 dias úteis'],
  'E-commerce': ['Catálogo de produtos', 'Checkout integrado', 'Design responsivo', 'Entrega em até 14 dias úteis'],
  'Blog / Portal': ['Estrutura de posts e categorias', 'Otimização básica de SEO', 'Design responsivo', 'Entrega em até 14 dias úteis'],
  'SaaS': ['Landing page do produto', 'Seções de recursos e planos', 'Design responsivo', 'Entrega em até 14 dias úteis'],
  'Portfolio': ['Galeria de projetos', 'Página de contato', 'Design responsivo', 'Entrega em até 14 dias úteis'],
  'Outros': ['Site profissional sob medida', 'Design responsivo', 'Entrega em até 14 dias úteis'],
}

export default function SitesGrid() {
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)

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

  // ESC to close preview modal
  useEffect(() => {
    if (!previewProduct) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPreviewProduct(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [previewProduct])

  const handleContract = useCallback((slug: string) => {
    router.push(`/login?mode=register&redirect=/products/${slug}`)
  }, [router])

  if (loadingProducts) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface overflow-hidden animate-pulse">
            <div className="aspect-[16/10] bg-elevated" />
            <div className="p-5 space-y-3">
              <div className="h-4 w-1/2 rounded bg-elevated" />
              <div className="h-3 w-3/4 rounded bg-elevated" />
              <div className="h-8 w-full rounded-xl bg-elevated mt-4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Sort: featured first
  const sorted = [...products].sort((a, b) => {
    const aF = getProductMeta(a.name).featured ? 0 : 1
    const bF = getProductMeta(b.name).featured ? 0 : 1
    return aF - bF
  })

  // Filter
  const filtered = activeFilter === 'Todos'
    ? sorted
    : sorted.filter((p) => getProductMeta(p.name).category === activeFilter)

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {FILTER_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeFilter === cat
                ? 'bg-brand text-white shadow-lg shadow-brand/20'
                : 'bg-elevated text-secondary hover:bg-elevated hover:text-foreground border border-border'
            }`}
          >
            {cat}
          </button>
        ))}
        <a
          href={WHATSAPP_HELP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-brand/30 bg-brand/10 text-brand hover:bg-brand/20 transition-all duration-200"
        >
          <MessageCircle size={14} className="shrink-0" />
          {HELP_FILTER}
        </a>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((product, i) => {
          const meta = getProductMeta(product.name)
          const features = CATEGORY_FEATURES[meta.category] ?? CATEGORY_FEATURES.Outros

          return (
            <ScrollReveal key={product.id} delay={((i % 3) + 1) as 1 | 2 | 3} className="flex">
              <div
                className={`group relative rounded-2xl bg-surface transition-all duration-300 lg:hover:-translate-y-1.5 lg:hover:z-30 flex flex-col w-full ${
                  meta.featured
                    ? 'border border-brand/20 lg:hover:border-brand/40 lg:hover:shadow-brand/15 featured-card'
                    : 'border border-border lg:hover:border-border-strong lg:hover:shadow-black/10 dark:lg:hover:shadow-black/40'
                }`}
              >
                {/* Discount badge */}
                <div className="absolute top-3 right-3 z-20">
                  <div className="discount-shimmer text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg opacity-80">
                    <Flame size={11} className="shrink-0" />
                    -30%
                  </div>
                </div>

                {/* Preview image */}
                <div className="aspect-[16/10] relative overflow-hidden bg-inset rounded-t-2xl">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover object-top transition-[object-position] duration-[3s] ease-in-out sm:group-hover:object-bottom"
                    />
                  ) : (
                    <div className="absolute inset-0 p-5 flex flex-col justify-between opacity-30 group-hover:opacity-50 transition-opacity" style={{ background: 'linear-gradient(135deg, var(--inset) 0%, var(--elevated) 100%)' }}>
                      <div className="mt-8 space-y-2">
                        <div className="h-4 w-2/3 rounded-lg bg-elevated" />
                        <div className="h-2.5 w-full rounded bg-elevated" />
                        <div className="h-2.5 w-5/6 rounded bg-elevated" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-7 w-20 rounded-lg bg-brand/30" />
                        <div className="h-7 w-14 rounded-lg bg-elevated" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60 lg:group-hover:opacity-20 transition-opacity duration-500" />

                  {/* Hover overlay with buttons */}
                  <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                    <button
                      onClick={() => setPreviewProduct(product)}
                      className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                    >
                      Ver preview
                    </button>
                    <button
                      onClick={() => handleContract(product.slug)}
                      className="px-4 py-2 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-hover transition-colors shadow-lg shadow-brand/20"
                    >
                      Escolher este modelo
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {meta.featured && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-brand/10 border-brand/25 text-brand">
                        <Sparkles size={10} />
                        Destaque
                      </div>
                    )}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-elevated border-border text-secondary">
                      {meta.category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-foreground text-base mb-1.5 group-hover:text-brand transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted mb-4 line-clamp-2 leading-relaxed">{product.description}</p>

                  {/* Inclui */}
                  <div className="mb-5 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary mb-2">Inclui</p>
                    <ul className="space-y-1.5">
                      {features.map((feat, fi) => (
                        <li key={fi} className="flex items-start gap-1.5 text-xs text-muted leading-snug">
                          <Check size={13} className="text-brand shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pricing */}
                  <p className="text-[11px] text-muted mb-0.5">A partir de</p>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-2xl font-bold text-[#F97316]">
                      {fmt(discountedPrice(product.price))}
                    </span>
                    <span className="price-slash text-sm text-neutral-600 font-medium">
                      {fmt(product.price)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted mb-1.5">ou 3x sem juros</p>
                  <p className="flex items-center gap-1 text-[11px] text-green-400 font-medium mb-4">
                    <Zap size={10} />
                    30% OFF na primeira compra
                  </p>

                  <button
                    onClick={() => handleContract(product.slug)}
                    className={`w-full h-9 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-all duration-200 active:scale-[0.97] ${
                      meta.featured
                        ? 'lg:hover:shadow-lg lg:hover:shadow-brand/30 glow-brand-sm'
                        : 'lg:hover:shadow-md lg:hover:shadow-brand/20'
                    }`}
                  >
                    Escolher este modelo
                  </button>
                </div>
              </div>
            </ScrollReveal>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted">Nenhum template encontrado nesta categoria.</p>
        </div>
      )}

      {/* Preview Modal */}
      {previewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setPreviewProduct(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl bg-surface border border-border shadow-2xl shadow-black/10 dark:shadow-black/60">
            <button
              onClick={() => setPreviewProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-black/60 backdrop-blur-sm text-secondary hover:text-foreground hover:bg-elevated transition-colors"
            >
              <X size={20} />
            </button>

            {previewProduct.images?.[0] && (
              <img
                src={previewProduct.images[0]}
                alt={previewProduct.name}
                className="w-full rounded-t-2xl"
              />
            )}

            <div className="p-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{previewProduct.name}</h3>
                <p className="text-sm text-secondary mt-1">{previewProduct.description}</p>
                <div className="flex items-center gap-2.5 mt-3">
                  <span className="text-xl font-bold text-brand">
                    {fmt(discountedPrice(previewProduct.price))}
                  </span>
                  <span className="price-slash text-sm text-neutral-600">
                    {fmt(previewProduct.price)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleContract(previewProduct.slug)}
                className="shrink-0 px-6 py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition-colors shadow-lg shadow-brand/20"
              >
                Escolher este modelo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
