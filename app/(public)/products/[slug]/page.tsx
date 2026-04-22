'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'
import Button from '@/components/ui/Button'

type Product = {
  id: string
  name: string
  slug: string
  price: number
  description: string
  images: string[]
  references: { title: string; url: string }[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getDocs(query(collection(db, 'products'), where('slug', '==', slug)))
      .then((snap) => {
        if (snap.empty) {
          setNotFound(true)
        } else {
          const d = snap.docs[0]
          setProduct({ id: d.id, ...(d.data() as Omit<Product, 'id'>) })
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="pt-20 sm:pt-24 pb-16 sm:pb-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto animate-pulse space-y-8">
          <div className="h-4 w-32 rounded bg-white/5" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <div className="aspect-video rounded-2xl bg-white/5" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 rounded bg-white/8" />
              <div className="h-4 w-full rounded bg-white/5" />
              <div className="h-4 w-5/6 rounded bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="pt-20 sm:pt-24 pb-16 sm:pb-32 px-4 sm:px-6 text-center">
        <p className="text-neutral-400">Site não encontrado.</p>
        <Link href="/products" className="text-brand text-sm mt-4 inline-block hover:underline">
          Ver todos os sites
        </Link>
      </div>
    )
  }

  const price = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.price / 100)

  return (
    <div className="pt-20 sm:pt-24 pb-16 sm:pb-32 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-12">
          <Link href="/products" className="hover:text-white transition-colors">
            Sites
          </Link>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Left — Visual */}
          <div className="lg:sticky lg:top-28">
            <div className="aspect-video rounded-2xl bg-dark-card border border-white/5 overflow-hidden relative">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-neutral-600">Preview em breve</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Additional images */}
            {product.images?.length > 1 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {product.images.slice(1).map((img, i) => (
                  <div key={i} className="aspect-video rounded-xl overflow-hidden border border-white/5">
                    <img src={img} alt="" className="w-full h-full object-cover object-top" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Details */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{product.name}</h1>
            <p className="text-neutral-400 leading-relaxed mb-8">{product.description}</p>

            {/* References */}
            {product.references?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-white uppercase tracking-widest mb-4">
                  Referências
                </h2>
                <ul className="space-y-2">
                  {product.references.map((ref, i) => (
                    <li key={i}>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-brand hover:underline"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {ref.title || ref.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Price + CTA */}
            <div className="p-6 rounded-2xl bg-dark-card border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Preço fixo</p>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{price}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-neutral-500 mb-1">Pagamento único</p>
                  <p className="text-sm text-brand font-medium">Sem taxas ocultas</p>
                </div>
              </div>
              <Link href="/login" className="block">
                <Button size="lg" className="w-full shadow-2xl shadow-brand/30">
                  Comprar — {price}
                </Button>
              </Link>
              <p className="text-xs text-neutral-600 text-center mt-4">
                Checkout seguro via Stripe. Confirmação imediata.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
