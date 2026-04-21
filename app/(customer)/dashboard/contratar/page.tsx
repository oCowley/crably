'use client'

import { useEffect, useState } from 'react'
import {
  ImageIcon, X, ShoppingCart, ExternalLink,
  Link2, Eye, Sparkles, Globe,
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

// ─── helpers ─────────────────────────────────────────────────────────────────

function normalizeUrl(url: string): string {
  if (!url) return url
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function toDomain(url: string): string {
  try { return new URL(normalizeUrl(url)).hostname.replace('www.', '') }
  catch { return url }
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function discounted(cents: number, pct: number) {
  return Math.round(cents * (1 - pct / 100))
}

// ─── model card ───────────────────────────────────────────────────────────────

function ModelCard({ title, url }: { title: string; url: string }) {
  const [blocked, setBlocked] = useState(false)
  const normalized = normalizeUrl(url)
  const domain = toDomain(url)

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden border border-white/8 bg-[#111] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/70 hover:border-white/15">

      {/* ── browser chrome ── */}
      <div className="shrink-0 flex items-center gap-3 px-3.5 py-2.5 bg-[#191919] border-b border-white/[0.07]">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 flex items-center gap-1.5 bg-white/[0.06] rounded-md px-2.5 py-1 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400/70 shrink-0" />
          <span className="text-[11px] text-neutral-500 truncate font-mono leading-none">{domain}</span>
        </div>
      </div>

      {/* ── iframe preview ── */}
      <div className="relative overflow-hidden" style={{ height: 180 }}>
        {!blocked ? (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <iframe
              src={normalized}
              className="border-0 absolute top-0 left-0"
              title={title || domain}
              onError={() => setBlocked(true)}
              style={{
                width: 1280,
                height: 720,
                transform: 'scale(0.25)',
                transformOrigin: 'top left',
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#111]">
            <Globe size={26} className="text-neutral-700" />
            <p className="text-xs text-neutral-600 font-mono">{domain}</p>
          </div>
        )}

        {/* bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#111] via-[#111]/60 to-transparent pointer-events-none z-10" />

        {/* hover overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300 opacity-0 group-hover:opacity-100">
          <a
            href={normalized}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-xs font-bold shadow-xl scale-90 group-hover:scale-100 transition-transform duration-300"
          >
            <ExternalLink size={13} />
            Abrir site
          </a>
        </div>
      </div>

      {/* ── footer ── */}
      <div className="px-4 py-3 flex items-center justify-between gap-2 bg-[#111]">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{title || domain}</p>
          <p className="text-[11px] text-neutral-600 mt-0.5 truncate">{domain}</p>
        </div>
        <a
          href={normalized}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-2 rounded-lg text-neutral-600 hover:text-white hover:bg-white/8 transition-colors"
        >
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  )
}

// ─── portfolio modal ──────────────────────────────────────────────────────────

function PortfolioModal({
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
  const displayPrice = isFirstPurchase ? discounted(product.price, 30) : product.price
  const refs = product.references ?? []
  const imgs = product.images ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div
        className="relative w-full max-w-5xl bg-[#0b0b0b] border border-white/8 rounded-2xl shadow-2xl overflow-hidden animate-fade-up flex flex-col"
        style={{ maxHeight: '94vh' }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <Link2 size={14} className="text-brand" />
              <h2 className="text-base font-bold text-white">Portfólio de modelos</h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">



            {/* models grid */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">
                Nossos modelos de projeto — {refs.length} {refs.length === 1 ? 'exemplar' : 'exemplares'}
              </p>

              {refs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Globe size={32} className="text-neutral-700" />
                  <p className="text-sm text-neutral-600">Nenhum modelo disponível ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {refs.map((r, i) => (
                    <ModelCard key={i} title={r.title} url={r.url} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* sticky footer — price + CTA */}
        <div className="shrink-0 border-t border-white/[0.06] bg-[#0b0b0b] px-6 py-4 flex items-center justify-between gap-6">
          <div>
            <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-medium">A partir de</p>
            {isFirstPurchase ? (
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-brand">{fmt(displayPrice)}</span>
                <span className="text-sm text-neutral-600 line-through">{fmt(product.price)}</span>
                <span className="text-xs font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">−30%</span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-brand mt-0.5">{fmt(product.price)}</p>
            )}
          </div>
          <button
            onClick={() => { onClose(); onAddToCart() }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold transition-all shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <ShoppingCart size={15} />
            Adicionar ao carrinho
          </button>
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
                <div className="aspect-[4/3] relative overflow-hidden shrink-0 bg-[#0d0d0d]">
                  {product.images?.[0] ? (
                    <>
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover object-top"
                      />
                      {/* fade para o card */}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#111111] to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={28} className="text-neutral-700" />
                    </div>
                  )}

                  {/* first purchase badge */}
                  {isFirstPurchase && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-green-500 shadow-lg shadow-green-500/30">
                      <Sparkles size={11} className="text-white" />
                      <span className="text-[11px] font-black text-white">{DISCOUNT_PCT}% OFF</span>
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
                        className="flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-white hover:bg-neutral-100 text-black text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                      >
                        <Eye size={14} />
                        Ver exemplos
                      </button>
                    )}
                    <button
                      onClick={() => setConfiguring(product)}
                      className={[
                        'flex items-center justify-center gap-2 h-11 rounded-xl text-white text-sm font-bold transition-all',
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
        <PortfolioModal
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
