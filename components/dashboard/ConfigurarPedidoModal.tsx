'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  productName: string
  productType: string
  basePrice: number
  initialData?: {
    projectName: string
    briefing: string
    reference: string
    prazo: '14dias' | '7dias'
  }
  onClose: () => void
  onConfirm: (data: {
    projectName: string
    briefing: string
    reference: string
    prazo: '14dias' | '7dias'
    finalPrice: number
  }) => void
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export default function ConfigurarPedidoModal({
  productName,
  productType,
  basePrice,
  initialData,
  onClose,
  onConfirm,
}: ModalProps) {
  const [projectName, setProjectName] = useState(initialData?.projectName ?? '')
  const [briefing, setBriefing] = useState(initialData?.briefing ?? '')
  const [reference, setReference] = useState(initialData?.reference ?? '')
  const [prazo, setPrazo] = useState<'14dias' | '7dias'>(initialData?.prazo ?? '14dias')

  const finalPrice = prazo === '7dias' ? Math.round(basePrice * 1.5) : basePrice

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm({ projectName, briefing, reference, prazo, finalPrice })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-white">Configurar pedido</h2>
            <p className="text-sm text-neutral-400 mt-0.5">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Nome do projeto <span className="text-brand">*</span>
            </label>
            <input
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ex: Site da minha empresa"
              className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Briefing / descrição <span className="text-brand">*</span>
            </label>
            <textarea
              required
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              placeholder="Descreva o projeto, público-alvo, objetivos, estilo visual desejado..."
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-brand/50 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              URL de referência{' '}
              <span className="text-neutral-500 font-normal">(opcional)</span>
            </label>
            <input
              type="url"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="https://exemplo.com"
              className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>

          {/* Prazo selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Prazo de entrega
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPrazo('14dias')}
                className={[
                  'p-3.5 rounded-xl border text-left transition-all duration-200',
                  prazo === '14dias'
                    ? 'bg-brand/10 border-brand/40 text-white'
                    : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:border-white/20',
                ].join(' ')}
              >
                <p className="text-sm font-semibold">14 dias</p>
                <p className="text-xs mt-0.5 opacity-70">Prazo padrão</p>
                <p className="text-sm font-bold mt-2 text-brand">{formatPrice(basePrice)}</p>
              </button>
              <button
                type="button"
                onClick={() => setPrazo('7dias')}
                className={[
                  'p-3.5 rounded-xl border text-left transition-all duration-200',
                  prazo === '7dias'
                    ? 'bg-brand/10 border-brand/40 text-white'
                    : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:border-white/20',
                ].join(' ')}
              >
                <p className="text-sm font-semibold">7 dias</p>
                <p className="text-xs mt-0.5 opacity-70">Express +50%</p>
                <p className="text-sm font-bold mt-2 text-brand">
                  {formatPrice(Math.round(basePrice * 1.5))}
                </p>
              </button>
            </div>
          </div>

          {/* Price summary */}
          <div className="flex items-center justify-between pt-2 pb-1 border-t border-white/5">
            <span className="text-sm text-neutral-400">Total do pedido</span>
            <span className="text-2xl font-bold text-brand">{formatPrice(finalPrice)}</span>
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors"
          >
            {initialData ? 'Salvar alterações' : 'Adicionar ao carrinho →'}
          </button>
        </form>
      </div>
    </div>
  )
}
