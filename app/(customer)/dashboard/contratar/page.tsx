'use client'

import { useEffect, useState } from 'react'
import {
  ImageIcon, X, ShoppingCart, ExternalLink,
  AlertCircle, Link2, ChevronLeft, ChevronRight, Eye, Sparkles,
} from 'lucide-react'
import ConfigurarPedidoModal from '@/components/dashboard/ConfigurarPedidoModal'
import { useCart } from '@/contexts/CartContext'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

// ─── types ───────────────────────────────────────────────────────────────────

interface Reference { title: string; url: string }

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  images: string[]
  references: Reference[]
}

type MediaItem =
  | { kind: 'image'; url: string; label: string }
  | { kind: 'ref';   url: string; label: string }

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

}

function discounted(cents: number, pct: number) {
  return Math.round(cents * (1 - pct / 100))
}

function buildMedia(product: Product): MediaItem[] {
  return [
    ...(product.images ?? []).map((url, i) => ({ kind: 'image' as const, url, label: `Imagem ${i + 1}` })),
    ...(product.references ?? []).map((r, i) => ({ kind: 'ref' as const, url: r.url, label: r.title || `Exemplo ${i + 1}` })),
  ]
}

// ─── gallery modal ────────────────────────────────────────────────────────────

function GalleryModal({
  product,
  isFirstPurchase,
  onClose,
  onAddToCart,
}: {
  product: Product
  isFirstPurchase: boolean
  onClose: () => void
  onAddToCart: () => void
}) {
  const media = buildMedia(product)
  const [active, setActive] = useState(0)
  const [iframeError, setIframeError] = useState(false)
  const current = media[active]

  function go(delta: number) {
    setIframeError(false)
    setActive((i) => (i + delta + media.length) % media.length)
  }

  function select(i: number) {
    setIframeError(false)
    setActive(i)
  }

  const displayPrice = isFirstPurchase ? discounted(product.price, 30) : product.price

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div
        className="relative w-full max-w-6xl bg-[#0b0b0b] border border-white/8 rounded-2xl shadow-2xl overflow-hidden animate-fade-up flex flex-col"
        style={{ maxHeight: '94vh' }}
      >
        {/* top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] shrink-0">
          <span className="text-sm font-semibold text-white">{product.name}</span>
          <div className="flex items-center gap-3">
            {current && (
              <a href={current.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors">
                <ExternalLink size={12} /> Abrir
              </a>
            )}
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* main preview */}
          <div className="flex-1 flex flex-col bg-[#070707] min-w-0 overflow-hidden">
            <div className="flex-1 relative overflow-hidden">
              {media.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <ImageIcon size={36} className="text-neutral-700" />
                  <p className="text-sm text-neutral-600">Nenhuma mídia disponível.</p>
                </div>
              )}
              {current?.kind === 'image' && (
                <img src={current.url} alt={current.label} className="w-full h-full object-contain" />
              )}
              {current?.kind === 'ref' && !iframeError && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-0 left-0 origin-top-left"
                    style={{ width: '200%', height: '200%', transform: 'scale(0.5)' }}>
                    <iframe key={current.url} src={current.url} className="w-full h-full border-0"
                      title={current.label} onError={() => setIframeError(true)} />
                  </div>
                </div>
              )}
              {current?.kind === 'ref' && iframeError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-10">
                  <div className="w-14 h-14 rounded-2xl bg-red-400/10 border border-red-400/10 flex items-center justify-center">
                    <AlertCircle size={24} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-300">Preview bloqueado</p>
                    <p className="text-xs text-neutral-600 mt-1">Este site não permite incorporação via iframe.</p>
                  </div>
                  <a href={current.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-brand/30 text-brand text-sm font-medium hover:bg-brand/10 transition-colors">
                    <ExternalLink size={13} /> Abrir em nova aba
                  </a>
                </div>
              )}
              {media.length > 1 && (
                <>
                  <button onClick={() => go(-1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-white flex items-center justify-center transition-colors backdrop-blur-sm">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => go(1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-white flex items-center justify-center transition-colors backdrop-blur-sm">
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
              {media.length > 0 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-xs text-neutral-400">
                  {active + 1} / {media.length}
                </div>
              )}
            </div>

            {/* thumbnail strip */}
            {media.length > 1 && (
              <div className="shrink-0 border-t border-white/[0.06] p-3 flex gap-2 overflow-x-auto bg-[#090909]">
                {media.map((item, i) => (
                  <button key={i} onClick={() => select(i)} title={item.label}
                    className={[
                      'shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all',
                      i === active ? 'border-brand shadow-md shadow-brand/20' : 'border-white/[0.07] hover:border-white/20',
                    ].join(' ')}>
                    {item.kind === 'image' ? (
                      <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/[0.03] flex flex-col items-center justify-center gap-1">
                        <Link2 size={14} className={i === active ? 'text-brand' : 'text-neutral-600'} />
                        <span className="text-[9px] text-neutral-600 px-1 truncate w-full text-center">{item.label}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* right panel */}
          <div className="w-64 shrink-0 flex flex-col border-l border-white/[0.06] overflow-y-auto">
            <div className="flex-1 p-5 flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-white leading-snug">{product.name}</h2>
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed line-clamp-4">{product.description}</p>

                <div className="mt-5">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-medium mb-1">A partir de</p>
                  {isFirstPurchase ? (
                    <div>
                      <p className="text-sm text-neutral-600 line-through">{fmt(product.price)}</p>
                      <p className="text-3xl font-bold text-brand">{fmt(displayPrice)}</p>
                      <p className="text-xs text-green-400 font-semibold mt-1">Desconto de 30% aplicado ✓</p>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-brand">{fmt(product.price)}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => { onClose(); onAddToCart() }}
                className="w-full h-12 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShoppingCart size={15} />
                Adicionar ao carrinho
              </button>

              <div className="space-y-1">
                {(product.images?.length ?? 0) > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                    <span className="text-xs text-neutral-500">Imagens</span>
                    <span className="text-xs font-medium text-neutral-300">{product.images.length}</span>
                  </div>
                )}
                {(product.references?.length ?? 0) > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                    <span className="text-xs text-neutral-500">Exemplos</span>
                    <span className="text-xs font-medium text-neutral-300">{product.references.length}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-neutral-500">Página pública</span>
                  <a href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-medium text-brand hover:underline">Ver →</a>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.025] border border-white/[0.05] p-3.5 space-y-2.5 mt-auto">
                {['Entrega em até 14 dias', 'Suporte no período de entrega', 'Express em 7 dias (+50%)'].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                    <span className="text-[11px] text-neutral-400 leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ContratarPage() {
  const { addItem } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isFirstPurchase, setIsFirstPurchase] = useState(false)
  const [gallery, setGallery] = useState<Product | null>(null)
  const [configuring, setConfiguring] = useState<Product | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const uid = auth.currentUser?.uid
        const [productsSnap, ordersSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          uid
            ? getDocs(query(collection(db, 'orders'), where('userId', '==', uid)))
            : Promise.resolve(null),
        ])
        setProducts(
          productsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Product, 'id'>) })),
        )
        if (uid) setIsFirstPurchase((ordersSnap?.size ?? 0) === 0)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function handleConfirm(data: {
    projectName: string
    briefing: string
    reference: string
    prazo: '14dias' | '7dias'
    extraMeeting: boolean
    selectedAddons: string[]
    couponCode?: string
    discountPct?: number
    finalPrice: number
  }) {
    if (!configuring) return
    addItem({
      productName: configuring.name,
      productType: configuring.id,
      projectName: data.projectName,
      briefing: data.briefing,
      reference: data.reference,
      prazo: data.prazo,
      basePrice: configuring.price / 100,
      finalPrice: data.finalPrice,
    })
    setConfiguring(null)
    showToast(`"${configuring.name}" adicionado ao carrinho!`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500 text-sm">Carregando produtos...</p>
      </div>
    )
  }

  const DISCOUNT_PCT = 30

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Contratar site</h1>
        <p className="text-neutral-400 mt-1 text-sm">Escolha o produto ideal e configure seu pedido</p>
      </div>

      {/* first purchase banner */}
      {isFirstPurchase && (
        <div className="mb-8 relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-r from-green-500/[0.08] via-green-500/[0.05] to-brand/[0.08] p-5">
          {/* glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-green-500/15 border border-green-500/25 flex items-center justify-center shrink-0">
              <Sparkles size={22} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white">
                🎉 Sua primeira compra tem {DISCOUNT_PCT}% de desconto!
              </p>
              <p className="text-sm text-neutral-400 mt-0.5">
                O cupom{' '}
                <span className="font-mono font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-md text-xs">
                  PRIMEIRACOMPRA
                </span>{' '}
                será aplicado automaticamente no carrinho.
              </p>
            </div>
            <div className="shrink-0 text-right hidden sm:block">
              <p className="text-3xl font-black text-green-400">{DISCOUNT_PCT}%</p>
              <p className="text-xs text-green-500/70 font-medium">OFF</p>
            </div>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-neutral-500 text-sm">Nenhum produto disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {products.map((product) => {
            const hasMedia = (product.images?.length ?? 0) + (product.references?.length ?? 0) > 0
            const priceAfter = isFirstPurchase ? discounted(product.price, DISCOUNT_PCT) : product.price

            return (
              <div
                key={product.id}
                className="flex flex-col rounded-2xl border bg-[#111111] border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 overflow-hidden"
              >
                {/* image */}
                <div className="h-48 bg-gradient-to-br from-white/[0.04] to-transparent flex items-center justify-center overflow-hidden shrink-0 relative">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={28} className="text-neutral-700" />
                  )}

                  {/* first purchase badge */}
                  {isFirstPurchase && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-green-500 shadow-lg shadow-green-500/30">
                      <Sparkles size={11} className="text-white" />
                      <span className="text-[11px] font-black text-white">{DISCOUNT_PCT}% OFF</span>
                    </div>
                  )}

                  {hasMedia && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <span className="text-xs font-medium text-white/70">Clique para ver galeria</span>
                    </div>
                  )}
                </div>

                {/* content */}
                <div className="flex flex-col flex-1 p-5 gap-4">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white">{product.name}</h3>
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                  </div>

                  {/* price */}
                  {isFirstPurchase ? (
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl font-bold text-brand">{fmt(priceAfter)}</span>
                      <span className="text-sm text-neutral-600 line-through">{fmt(product.price)}</span>
                      <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                        −{DISCOUNT_PCT}%
                      </span>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-brand">{fmt(product.price)}</p>
                  )}

                  {/* actions */}
                  <div className="flex gap-2 pt-1 border-t border-white/[0.06]">
                    {hasMedia && (
                      <button
                        onClick={() => setGallery(product)}
                        className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white text-xs font-medium transition-colors shrink-0"
                      >
                        <Eye size={13} />
                        Ver exemplos
                      </button>
                    )}
                    <button
                      onClick={() => setConfiguring(product)}
                      className={[
                        'flex items-center justify-center gap-2 h-10 rounded-xl text-white text-sm font-bold transition-all',
                        'bg-brand hover:bg-brand-hover shadow-lg shadow-brand/20 hover:shadow-brand/40 hover:scale-[1.02] active:scale-[0.98]',
                        hasMedia ? 'flex-1' : 'w-full',
                      ].join(' ')}
                    >
                      <ShoppingCart size={14} />
                      Adicionar ao carrinho
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {gallery && (
        <GalleryModal
          product={gallery}
          isFirstPurchase={isFirstPurchase}
          onClose={() => setGallery(null)}
          onAddToCart={() => setConfiguring(gallery)}
        />
      )}

      {configuring && (
        <ConfigurarPedidoModal
          productName={configuring.name}
          productType={configuring.id}
          basePrice={configuring.price / 100}
          initialCoupon={isFirstPurchase ? 'PRIMEIRACOMPRA' : undefined}
          onClose={() => setConfiguring(null)}
          onConfirm={handleConfirm}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] px-5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white shadow-xl animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
