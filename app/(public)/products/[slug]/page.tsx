import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Button from '@/components/ui/Button'

const PRODUCTS: Record<string, { name: string; price: number; description: string; features: string[] }> = {
  'agency-pro': {
    name: 'Agency Pro',
    price: 299700,
    description:
      'Landing page arrojada e focada em conversão para agências e estúdios criativos. Tudo que você precisa para conquistar clientes online — do hero impactante ao portfólio e contato.',
    features: [
      'Hero com headline animada',
      'Seção de serviços',
      'Portfólio / cases',
      'Depoimentos',
      'Formulário de contato',
      'Responsivo para mobile',
      'Otimizado para SEO',
      'Entrega em 7 dias',
    ],
  },
  'saas-launch': {
    name: 'SaaS Launch',
    price: 199700,
    description:
      'Landing page moderna para SaaS com tabela de preços, grid de features, FAQ e CTAs otimizados para converter visitantes em usuários.',
    features: [
      'Grid de features',
      'Tabela de preços (3 planos)',
      'FAQ em acordeão',
      'Prova social / logos',
      'CTA de captura de e-mail',
      'Responsivo para mobile',
      'Otimizado para SEO',
      'Entrega em 5 dias',
    ],
  },
  'local-business': {
    name: 'Negócio Local',
    price: 99700,
    description:
      'Site limpo e profissional para negócios locais. Inclui formulário de contato, integração com Google Maps, serviços e seção sobre.',
    features: [
      'Vitrine de serviços',
      'Seção sobre',
      'Mapa Google incorporado',
      'Formulário de contato',
      'CTA WhatsApp',
      'Responsivo para mobile',
      'Otimizado para SEO',
      'Entrega em 3 dias',
    ],
  },
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = PRODUCTS[slug]
  if (!product) return {}
  return { title: product.name, description: product.description }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = PRODUCTS[slug]

  if (!product) notFound()

  const price = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.price / 100)

  return (
    <div className="pt-24 pb-32 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-12">
          <Link href="/products" className="hover:text-white transition-colors">
            Templates
          </Link>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left — Visual */}
          <div className="sticky top-28">
            <div className="aspect-video rounded-2xl bg-dark-card border border-white/5 overflow-hidden relative">
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
            </div>
          </div>

          {/* Right — Details */}
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
            <p className="text-neutral-400 leading-relaxed mb-8">{product.description}</p>

            {/* Features */}
            <div className="mb-10">
              <h2 className="text-sm font-semibold text-white uppercase tracking-widest mb-4">
                O que está incluído
              </h2>
              <ul className="space-y-3">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-neutral-300">
                    <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Price + CTA */}
            <div className="p-6 rounded-2xl bg-dark-card border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Preço fixo</p>
                  <p className="text-4xl font-bold text-white">{price}</p>
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
