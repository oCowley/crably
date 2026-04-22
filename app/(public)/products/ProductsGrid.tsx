'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type Product = {
  id: string
  name: string
  slug: string
  price: number
  description: string
  images: string[]
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export default function ProductsGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'products'), orderBy('name')))
      .then((snap) => {
        const list: Product[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, 'id'>),
        }))
        setProducts(list)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-dark-card rounded-2xl border border-white/5 overflow-hidden animate-pulse">
            <div className="h-48 bg-white/5" />
            <div className="p-6 space-y-3">
              <div className="h-4 w-1/2 rounded bg-white/8" />
              <div className="h-3 w-full rounded bg-white/5" />
              <div className="h-3 w-3/4 rounded bg-white/5" />
              <div className="flex items-center justify-between mt-4">
                <div className="h-7 w-28 rounded bg-white/8" />
                <div className="h-9 w-24 rounded-xl bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Nenhum site disponível no momento.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="group relative bg-dark-card rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40"
        >
          {/* Thumbnail */}
          <div className="h-48 bg-dark-elevated relative overflow-hidden">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                    <svg className="w-8 h-8 text-white/20 group-hover:text-brand/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-brand transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6 line-clamp-2">
              {product.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">
                {formatPrice(product.price)}
              </span>
              <a
                href={`/products/${product.slug}`}
                className="inline-flex items-center justify-center h-9 px-4 text-sm font-semibold rounded-xl bg-brand text-white hover:bg-brand-hover active:scale-[0.97] transition-all duration-200 shadow-lg shadow-brand/20"
              >
                Comprar
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
