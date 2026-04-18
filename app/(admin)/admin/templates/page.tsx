import type { Metadata } from 'next'
import { Plus, ExternalLink, Pencil, Trash2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Admin — Sites' }

const TEMPLATES: {
  id: string
  name: string
  slug: string
  category: string
  price: number
  status: 'ativo' | 'rascunho'
  sales: number
  preview: string
}[] = [
  { id: 'tpl-001', name: 'Agency Pro', slug: 'agency-pro', category: 'Agência', price: 1800, status: 'ativo', sales: 12, preview: '#' },
  { id: 'tpl-002', name: 'SaaS Launch', slug: 'saas-launch', category: 'SaaS', price: 2400, status: 'ativo', sales: 8, preview: '#' },
  { id: 'tpl-003', name: 'Local Business', slug: 'local-business', category: 'Negócio local', price: 900, status: 'ativo', sales: 21, preview: '#' },
  { id: 'tpl-004', name: 'Portfolio Studio', slug: 'portfolio-studio', category: 'Portfólio', price: 1200, status: 'ativo', sales: 6, preview: '#' },
  { id: 'tpl-005', name: 'E-commerce Starter', slug: 'ecommerce-starter', category: 'E-commerce', price: 3200, status: 'rascunho', sales: 0, preview: '#' },
  { id: 'tpl-006', name: 'Restaurant Pro', slug: 'restaurant-pro', category: 'Restaurante', price: 1100, status: 'rascunho', sales: 0, preview: '#' },
]

export default function TemplatesPage() {
  const ativos = TEMPLATES.filter((t) => t.status === 'ativo').length
  const rascunhos = TEMPLATES.filter((t) => t.status === 'rascunho').length
  const totalVendas = TEMPLATES.reduce((s, t) => s + t.sales, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Sites</h1>
          <p className="text-neutral-500 text-sm">Gerencie os sites disponíveis na loja.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl transition-colors shrink-0">
          <Plus size={16} />
          Novo site
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Publicados', value: ativos, color: 'text-green-400' },
          { label: 'Rascunhos', value: rascunhos, color: 'text-neutral-400' },
          { label: 'Total de vendas', value: totalVendas, color: 'text-brand' },
        ].map((s) => (
          <div key={s.label} className="bento-card p-5">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid of templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {TEMPLATES.map((tpl) => (
          <div key={tpl.id} className="bento-card p-5 flex flex-col gap-4">
            {/* Preview placeholder */}
            <div className="h-36 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent" />
              <span className="text-neutral-600 text-xs font-medium relative z-10">Preview</span>
              <a
                href={tpl.preview}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                title="Ver preview"
              >
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Info */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-white text-sm truncate">{tpl.name}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{tpl.category}</p>
              </div>
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  tpl.status === 'ativo'
                    ? 'text-green-400 bg-green-400/10 border-green-400/20'
                    : 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20'
                }`}
              >
                {tpl.status === 'ativo' ? 'Ativo' : 'Rascunho'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-semibold text-white text-sm">
                R$ {tpl.price.toLocaleString('pt-BR')}
              </span>
              <span>{tpl.sales} {tpl.sales === 1 ? 'venda' : 'vendas'}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <button className="flex-1 inline-flex items-center justify-center gap-2 py-2 text-xs text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <Pencil size={13} />
                Editar
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 py-2 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-colors">
                <Trash2 size={13} />
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
