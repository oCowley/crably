import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Templates',
  description: 'Navegue pelos nossos templates de sites premium prontos para produção.',
}

const PRODUCTS = [
  {
    id: '1',
    name: 'Agency Pro',
    slug: 'agency-pro',
    price: 299700,
    description:
      'Landing page arrojada e focada em conversão para agências e estúdios criativos. Inclui hero, serviços, portfólio, depoimentos e contato.',
    images: [],
    tag: 'Mais popular',
  },
  {
    id: '2',
    name: 'SaaS Launch',
    slug: 'saas-launch',
    price: 199700,
    description:
      'Landing page moderna para SaaS com tabela de preços, grid de features, FAQ e CTAs otimizados para conversão.',
    images: [],
    tag: null,
  },
  {
    id: '3',
    name: 'Negócio Local',
    slug: 'local-business',
    price: 99700,
    description:
      'Site profissional para negócios locais com formulário de contato, integração com Google Maps, serviços e seção sobre.',
    images: [],
    tag: 'Melhor custo-benefício',
  },
  {
    id: '4',
    name: 'Portfolio Studio',
    slug: 'portfolio-studio',
    price: 149700,
    description:
      'Site de portfólio elegante para designers, fotógrafos e criativos. Galeria masonry, estudos de caso e animações suaves.',
    images: [],
    tag: null,
  },
  {
    id: '5',
    name: 'Restaurante & Food',
    slug: 'restaurant',
    price: 149700,
    description:
      'Site estiloso para restaurantes, cafés e negócios de alimentação. Cardápio, link de reservas, galeria e localização.',
    images: [],
    tag: null,
  },
  {
    id: '6',
    name: 'Consultoria Pro',
    slug: 'consulting',
    price: 199700,
    description:
      'Site de autoridade para consultores e coaches. Bio, serviços, cases, palestras e CTA de agendamento.',
    images: [],
    tag: null,
  },
]

function formatPrice(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export default function ProductsPage() {
  return (
    <div className="pt-24 pb-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">
            Todos os templates
          </p>
          <h1 className="text-5xl font-bold text-white mb-4">
            Feitos para converter
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto">
            Sites premium com preço fixo, entrega garantida e
            sem surpresas.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((product) => (
            <div
              key={product.id}
              className="group relative bg-dark-card rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40"
            >
              {product.tag && (
                <span className="absolute top-4 right-4 z-10 px-2 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold">
                  {product.tag}
                </span>
              )}

              {/* Thumbnail */}
              <div className="h-48 bg-dark-elevated relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                    <svg className="w-8 h-8 text-white/20 group-hover:text-brand/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
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
      </div>
    </div>
  )
}
