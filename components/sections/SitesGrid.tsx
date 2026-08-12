'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { X, Check, Sparkles, Lock } from 'lucide-react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import ScrollReveal from '@/components/ui/ScrollReveal'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import { whatsappUrl } from '@/lib/constants'

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

const META_MAP: { keywords: string[]; featured: boolean; category: string }[] = [
  { keywords: ['landing'], featured: true, category: 'Landing Page' },
  { keywords: ['saas', 'app web'], featured: true, category: 'SaaS' },
  { keywords: ['portf', 'portfolio', 'portfólio'], featured: false, category: 'Portfolio' },
  { keywords: ['info produto', 'infoproduto', 'info-produto'], featured: false, category: 'E-commerce' },
  { keywords: ['ecommerce', 'e-commerce', 'loja'], featured: false, category: 'E-commerce' },
  { keywords: ['blog', 'portal', 'conteudo', 'conteúdo'], featured: false, category: 'Blog / Portal' },
  { keywords: ['institucional', 'empresa', 'corporat'], featured: false, category: 'Institucional' },
  { keywords: ['pagina de vendas', 'página de vendas', 'vendas', 'venda', 'vsl', 'sales'], featured: false, category: 'Página de Vendas' },
]

function getProductMeta(name: string) {
  const lower = name.toLowerCase()
  const match = META_MAP.find((entry) => entry.keywords.some((kw) => lower.includes(kw)))
  return {
    featured: match?.featured ?? false,
    category: match?.category ?? 'Outros',
  }
}

const FILTER_CATEGORIES = ['Todos', 'Institucional', 'Landing Page', 'Página de Vendas', 'E-commerce', 'Blog / Portal']

const HELP_FILTER = 'Não sei qual escolher'

const WHATSAPP_HELP_URL = whatsappUrl('Olá! Não sei qual modelo de site escolher, podem me ajudar?')

// Só o que diferencia cada categoria — o que é comum a todos vive na faixa de garantias
const CATEGORY_FEATURES: Record<string, string[]> = {
  'Landing Page': ['Página única profissional', 'Formulário ou botão de WhatsApp'],
  'Institucional': ['Páginas de sobre, serviços e contato', 'Formulário de contato'],
  'Página de Vendas': ['Página focada em conversão', 'Seções de oferta e prova social'],
  'E-commerce': ['Catálogo de produtos', 'Checkout integrado'],
  'Blog / Portal': ['Estrutura de posts e categorias', 'Otimização básica de SEO'],
  'SaaS': ['Landing page do produto', 'Seções de recursos e planos'],
  'Portfolio': ['Galeria de projetos', 'Página de contato'],
  'Outros': ['Site profissional completo', 'Estrutura conforme o modelo'],
}

const INCLUDED_IN_ALL = ['Design responsivo', 'Entrega em até 14 dias úteis', 'Preço fixo', 'Suporte no WhatsApp']

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center gap-1.5 h-8 px-4 bg-inset border-b border-border">
              <Skeleton className="h-2 w-24" />
            </div>
            <Skeleton className="aspect-[16/10] rounded-none" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-8 w-full mt-4" />
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
      {/* Filter tabs — trilho único */}
      <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        <div className="inline-flex shrink-0 gap-1 p-1 rounded-full border border-border bg-surface">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === cat
                  ? 'bg-brand text-white shadow-glow-sm'
                  : 'text-secondary hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <a
          href={WHATSAPP_HELP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border-gradient text-brand hover:text-brand-light transition-colors duration-200"
        >
          <Image src="/images/whatsapp.png" alt="" width={16} height={16} className="shrink-0" />
          {HELP_FILTER}
        </a>
        <span className="hidden lg:block ml-auto shrink-0 font-mono text-xs text-faint uppercase tracking-widest">
          {String(filtered.length).padStart(2, '0')} {filtered.length === 1 ? 'modelo' : 'modelos'}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {filtered.map((product, i) => {
          const meta = getProductMeta(product.name)
          const features = CATEGORY_FEATURES[meta.category] ?? CATEGORY_FEATURES.Outros

          return (
            <ScrollReveal key={product.id} delay={((i % 3) + 1) as 1 | 2 | 3} className="flex">
              <div
                className={`group relative rounded-2xl card-spotlight transition-all duration-300 lg:hover:-translate-y-1.5 lg:hover:z-30 flex flex-col w-full ${
                  meta.featured
                    ? 'border border-brand/20 lg:hover:border-brand/40 lg:hover:shadow-glow-sm border-gradient border-gradient-animated'
                    : 'bg-surface border border-border lg:hover:border-border-strong lg:hover:shadow-black/10 dark:lg:hover:shadow-black/40'
                }`}
                style={meta.featured ? { background: 'linear-gradient(160deg, rgba(var(--brand-rgb),0.05) 0%, var(--surface) 45%)' } : undefined}
              >
                {/* Preview emoldurado em browser chrome */}
                <div className="rounded-t-2xl overflow-hidden">
                  <div className="flex items-center gap-2 h-8 px-4 bg-inset border-b border-border">
                    <span className="flex items-center gap-1.5 min-w-0 font-mono text-[10px] text-faint">
                      <Lock size={9} className="shrink-0" />
                      <span className="truncate">{product.slug}</span>
                    </span>
                  </div>

                  <div
                    className="aspect-[16/10] relative overflow-hidden bg-inset cursor-pointer"
                    onClick={() => setPreviewProduct(product)}
                  >
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover object-top transition-[object-position] duration-[3s] ease-in-out sm:group-hover:object-bottom"
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
                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                      <button
                        onClick={() => setPreviewProduct(product)}
                        className="h-9 px-4 rounded-xl glass text-sm font-semibold text-white hover:bg-white/20 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                      >
                        Ver preview
                      </button>
                      <span className="translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleContract(product.slug) }}
                        >
                          Escolher este modelo
                        </Button>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {meta.featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono text-[10px] font-bold uppercase tracking-wider bg-brand/10 border-brand/25 text-brand">
                        <Sparkles size={10} />
                        Destaque
                      </span>
                    )}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full border font-mono text-[10px] uppercase tracking-wider bg-elevated border-border text-secondary">
                      {meta.category}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-foreground mb-1.5 group-hover:text-brand transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted mb-4 line-clamp-2 leading-relaxed">{product.description}</p>

                  <ul className="space-y-1.5 mb-5">
                    {features.map((feat, fi) => (
                      <li key={fi} className="flex items-start gap-1.5 text-xs text-secondary leading-snug">
                        <Check size={13} className="text-brand shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex-1" />

                  {/* Pricing — "de X por Y" sem risco, promoção em verde */}
                  <div className="border-t border-border-subtle pt-4">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-faint">A partir de</p>
                      <p className="text-[11px] text-faint">antes {fmt(product.price)}</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl font-bold text-success">
                        {fmt(discountedPrice(product.price))}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full border font-mono text-[10px] font-bold bg-success/10 border-success/25 text-success">
                        −30%
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1.5">
                      ou 3x de {fmt(Math.round(discountedPrice(product.price) / 3))} sem juros
                    </p>
                  </div>

                  <Button
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => handleContract(product.slug)}
                  >
                    Escolher este modelo
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <p className="font-mono text-xs uppercase tracking-widest text-faint mb-2">Nenhum resultado</p>
          <p className="text-sm text-muted">Nenhum modelo nesta categoria ainda.</p>
        </div>
      )}

      {/* Garantias comuns a todos os modelos */}
      {filtered.length > 0 && (
        <ScrollReveal className="mt-10">
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5 rounded-2xl border border-border-subtle bg-surface/50 px-6 py-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-faint">
              Todos os modelos incluem
            </span>
            {INCLUDED_IN_ALL.map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-xs text-secondary">
                <Check size={12} className="text-brand shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </ScrollReveal>
      )}

      {/* Preview Modal */}
      {previewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-overlay backdrop-blur-md"
            onClick={() => setPreviewProduct(null)}
          />
          <div className="animate-pop-in relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-3xl bg-surface border-gradient shadow-2xl shadow-black/10 dark:shadow-black/60">
            <button
              onClick={() => setPreviewProduct(null)}
              aria-label="Fechar preview"
              className="absolute top-4 right-4 z-10 p-2 rounded-xl glass text-secondary hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            {previewProduct.images?.[0] && (
              <Image
                src={previewProduct.images[0]}
                alt={previewProduct.name}
                width={1280}
                height={800}
                sizes="(min-width: 896px) 896px, 100vw"
                className="w-full h-auto rounded-t-3xl"
              />
            )}

            <div className="sticky bottom-0 glass p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{previewProduct.name}</h3>
                <p className="text-sm text-secondary mt-1">{previewProduct.description}</p>
                <div className="flex items-center gap-2.5 mt-3">
                  <span className="text-xl font-bold text-success">
                    {fmt(discountedPrice(previewProduct.price))}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full border font-mono text-[10px] font-bold bg-success/10 border-success/25 text-success">
                    −30%
                  </span>
                  <span className="text-sm text-faint">
                    antes {fmt(previewProduct.price)}
                  </span>
                </div>
              </div>
              <Button
                size="lg"
                className="shrink-0"
                onClick={() => handleContract(previewProduct.slug)}
              >
                Escolher este modelo
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
