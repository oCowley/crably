'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'
import ConfigurarPedidoModal from '@/components/dashboard/ConfigurarPedidoModal'
import { useCart } from '@/contexts/CartContext'

interface Product {
  id: string
  name: string
  description: string
  price: number
  tag: string
  tagClass: string
  prazo: number
  featured?: boolean
}

const PRODUCTS: Product[] = [
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: '1 página, até 6 seções',
    price: 1200,
    tag: 'Maior desconto',
    tagClass: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    prazo: 7,
  },
  {
    id: 'blog-portal',
    name: 'Blog / Portal',
    description: 'CMS + listagem + posts',
    price: 1800,
    tag: 'Ótimo custo-benefício',
    tagClass: 'bg-green-500/15 text-green-400 border border-green-500/20',
    prazo: 10,
  },
  {
    id: 'infoprodutos',
    name: 'Loja de Infoprodutos',
    description: 'Checkout + área do aluno',
    price: 2200,
    tag: 'Mais procurado',
    tagClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
    prazo: 10,
  },
  {
    id: 'institucional',
    name: 'Site Institucional',
    description: 'Até 5 páginas + contato',
    price: 2800,
    tag: 'Mais vendido',
    tagClass: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    prazo: 14,
    featured: true,
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Catálogo + carrinho + checkout',
    price: 4500,
    tag: 'Completo',
    tagClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    prazo: 14,
  },
  {
    id: 'saas',
    name: 'SaaS / App Web',
    description: 'Auth + dashboard + lógica',
    price: 7000,
    tag: 'Premium',
    tagClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    prazo: 14,
  },
]

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export default function ContratarPage() {
  const { addItem } = useCart()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleConfirm(data: {
    projectName: string
    briefing: string
    reference: string
    prazo: '14dias' | '7dias'
    finalPrice: number
  }) {
    if (!selectedProduct) return
    addItem({
      productName: selectedProduct.name,
      productType: selectedProduct.id,
      projectName: data.projectName,
      briefing: data.briefing,
      reference: data.reference,
      prazo: data.prazo,
      basePrice: selectedProduct.price,
      finalPrice: data.finalPrice,
    })
    setSelectedProduct(null)
    showToast(`"${selectedProduct.name}" adicionado ao carrinho!`)
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Contratar site</h1>
        <p className="text-neutral-400 mt-1 text-sm">
          Escolha o produto e configure seu pedido
        </p>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {PRODUCTS.map((product) => (
          <div
            key={product.id}
            className={[
              'relative flex flex-col p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 group',
              product.featured
                ? 'bg-[#111111] border-brand/40 hover:border-brand/60'
                : 'bg-[#111111] border-white/5 hover:border-white/10',
            ].join(' ')}
          >
            {/* Featured glow */}
            {product.featured && (
              <div className="absolute inset-0 rounded-2xl bg-brand/5 pointer-events-none" />
            )}

            {/* Tag */}
            <div className="mb-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${product.tagClass}`}>
                {product.tag}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h3 className="text-base font-bold text-white">{product.name}</h3>
              <p className="text-sm text-neutral-400 mt-0.5">{product.description}</p>
              <div className="flex items-center gap-1.5 mt-3">
                <Clock size={13} className="text-neutral-600 shrink-0" />
                <span className="text-xs text-neutral-500">
                  {product.prazo} dias de prazo padrão
                </span>
              </div>
            </div>

            {/* Price + CTA */}
            <div className="mt-5 flex items-end justify-between">
              <span className="text-2xl font-bold text-brand">
                {formatPrice(product.price)}
              </span>
              <button
                onClick={() => setSelectedProduct(product)}
                className="h-9 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors shrink-0"
              >
                Configurar pedido →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedProduct && (
        <ConfigurarPedidoModal
          productName={selectedProduct.name}
          productType={selectedProduct.id}
          basePrice={selectedProduct.price}
          onClose={() => setSelectedProduct(null)}
          onConfirm={handleConfirm}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white shadow-xl animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
