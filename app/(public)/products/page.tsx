import type { Metadata } from 'next'
import ProductsGrid from './ProductsGrid'

export const metadata: Metadata = {
  title: 'Sites',
  description: 'Navegue pelos nossos sites premium prontos para produção.',
}

export default function ProductsPage() {
  return (
    <div className="pt-20 sm:pt-24 pb-16 sm:pb-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">
            Todos os sites
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Feitos para converter
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto">
            Sites premium com preço fixo, entrega garantida e sem surpresas.
          </p>
        </div>

        <ProductsGrid />
      </div>
    </div>
  )
}
