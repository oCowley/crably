'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type Product = {
  id: string
  name: string
  slug: string
  price: number
  description: string
  images: string[]
}

export default function TemplateShowcase() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  useEffect(() => {
    getDocs(query(collection(db, 'products'), orderBy('name'), limit(3)))
      .then((snap) => {
        const list: Product[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, 'id'>),
        }))
        setProducts(list)
      })
      .finally(() => setLoading(false))
  }, [])

  const fmt = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

  if (loading) {
    return (
      <div className="relative hidden lg:flex items-center justify-center min-h-[400px]">
        <div className="template-showcase-stack">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="template-card-skeleton animate-pulse"
              style={{
                transform: `translateZ(${-i * 40}px) translateY(${i * 12}px) translateX(${i * 8}px)`,
                zIndex: 3 - i,
              }}
            >
              <div className="aspect-[16/10] bg-elevated rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-1/2 rounded bg-elevated" />
                <div className="h-2 w-1/3 rounded bg-border" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div className="relative hidden lg:flex items-center justify-center">
      {/* Mobile: horizontal scroll */}
      <div className="lg:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 scrollbar-hide">
        {products.map((product, i) => (
          <button
            key={product.id}
            onClick={() => router.push('/products')}
            className="snap-center shrink-0 w-[280px] rounded-2xl bg-surface border border-border overflow-hidden text-left transition-all hover:border-brand/30"
          >
            <div className="aspect-[16/10] bg-inset overflow-hidden">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full bg-elevated" />
              )}
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold text-foreground">{product.name}</p>
              <p className="text-xs text-brand font-bold mt-1">{fmt(Math.round(product.price * 0.7))}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop: perspective stacked cards */}
      <div className="hidden lg:block" style={{ perspective: '1200px' }}>
        <div className="relative w-[460px] h-[380px]">
          {products.map((product, i) => {
            const isHovered = hoveredIdx === i
            const baseZ = (products.length - 1 - i) * 50
            const baseY = i * 16
            const baseX = i * 12
            const baseRotate = -3 + i * 2

            return (
              <button
                key={product.id}
                onClick={() => router.push('/products')}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="absolute inset-x-0 top-0 w-full rounded-2xl bg-surface border overflow-hidden text-left cursor-pointer"
                style={{
                  transform: isHovered
                    ? `translateZ(${baseZ + 30}px) translateY(${baseY - 8}px) translateX(${baseX}px) rotateY(${baseRotate}deg) scale(1.03)`
                    : `translateZ(${baseZ}px) translateY(${baseY}px) translateX(${baseX}px) rotateY(${baseRotate}deg)`,
                  zIndex: isHovered ? 10 : products.length - i,
                  borderColor: isHovered ? 'rgba(249,115,22,0.4)' : 'var(--border-color)',
                  boxShadow: isHovered
                    ? 'var(--shadow-card-hover), 0 0 30px rgba(249,115,22,0.1)'
                    : 'var(--shadow-card)',
                  transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                  animationDelay: `${i * 150}ms`,
                }}
              >
                <div className="aspect-[16/10] bg-inset overflow-hidden relative">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-elevated to-transparent" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
                </div>

                {/* Info overlay */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300"
                  style={{ opacity: isHovered ? 1 : 0.7 }}
                >
                  <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-brand font-bold mt-0.5">{fmt(Math.round(product.price * 0.7))}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
