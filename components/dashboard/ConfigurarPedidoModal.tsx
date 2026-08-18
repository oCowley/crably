'use client'

import { useState, useEffect } from 'react'
import {
  X, Check, Zap, Clock, Search, PenLine, ArrowUpRight,
  BarChart2, ClipboardList, Palette, Video, Tag, Wrench, TrendingUp,
} from 'lucide-react'
import { whatsappUrl } from '@/lib/constants'

// ─── coupons ─────────────────────────────────────────────────────────────────

// PRIMEIRACOMPRA não é cupom: o desconto de primeira compra é automático no carrinho
const VALID_COUPONS: Record<string, number> = {
  CRABLY10: 10,
  CRABLY20: 20,
}

function parseCoupon(code: string): { code: string; pct: number } | null {
  const key = code.trim().toUpperCase()
  const pct = VALID_COUPONS[key]
  return pct ? { code: key, pct } : null
}

// ─── add-ons catalogue ────────────────────────────────────────────────────────

const ADDONS = [
  {
    id: 'seo',
    icon: Search,
    label: 'SEO On-page',
    description: 'Títulos, meta tags e estrutura otimizados para o Google',
    price: 297,
  },
  {
    id: 'copy',
    icon: PenLine,
    label: 'Copywriting',
    description: 'Textos persuasivos escritos por redator especializado',
    price: 497,
  },
  {
    id: 'analytics',
    icon: BarChart2,
    label: 'Pixel & Analytics',
    description: 'Meta Pixel + Google Analytics 4 + Tag Manager configurados',
    price: 147,
  },
  {
    id: 'form',
    icon: ClipboardList,
    label: 'Formulário avançado',
    description: 'Integração com e-mail marketing e notificações automáticas',
    price: 197,
  },
  {
    id: 'brand',
    icon: Palette,
    label: 'Identidade visual',
    description: 'Logo + paleta de cores + tipografia entregues em arquivo',
    price: 497,
  },
] as const

type AddonId = (typeof ADDONS)[number]['id']

// ─── serviços sob consulta (fora do checkout — conversa no WhatsApp) ──────────

const CONSULT_SERVICES = [
  {
    id: 'manutencao',
    icon: Wrench,
    label: 'Manutenção do site',
    description: 'Atualizações de conteúdo, ajustes e monitoramento contínuo',
    message: 'Olá! Tenho interesse no serviço de manutenção de site da Crably. Podem me passar mais detalhes?',
  },
  {
    id: 'trafego',
    icon: TrendingUp,
    label: 'Gestão de tráfego',
    description: 'Campanhas no Google e Meta Ads para atrair clientes',
    message: 'Olá! Tenho interesse em gestão de tráfego com a Crably. Podem me passar mais detalhes?',
  },
] as const

// ─── types ───────────────────────────────────────────────────────────────────

interface ConfirmData {
  projectName: string
  briefing: string
  reference: string
  prazo: '14dias' | '7dias'
  extraMeeting: boolean
  selectedAddons: AddonId[]
  couponCode?: string
  discountPct?: number
  finalPrice: number
}

interface ModalProps {
  productName: string
  productType: string
  basePrice: number
  initialCoupon?: string
  initialData?: Partial<ConfirmData>
  onClose: () => void
  onConfirm: (data: ConfirmData) => void
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-faint uppercase tracking-widest mb-3">
      {children}
    </p>
  )
}

// ─── component ───────────────────────────────────────────────────────────────

export default function ConfigurarPedidoModal({
  productName,
  productType: _productType,
  basePrice,
  initialCoupon,
  initialData,
  onClose,
  onConfirm,
}: ModalProps) {
  const [projectName, setProjectName] = useState(initialData?.projectName ?? '')
  const [briefing, setBriefing] = useState(initialData?.briefing ?? '')
  const [reference, setReference] = useState(initialData?.reference ?? '')
  const [prazo, setPrazo] = useState<'14dias' | '7dias'>(initialData?.prazo ?? '14dias')
  const [extraMeeting, setExtraMeeting] = useState(initialData?.extraMeeting ?? false)
  const [selectedAddons, setSelectedAddons] = useState<Set<AddonId>>(
    new Set((initialData?.selectedAddons ?? []) as AddonId[]),
  )

  // coupon
  const autoCoupon = initialCoupon ? parseCoupon(initialCoupon) : null
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; pct: number; auto: boolean } | null>(
    autoCoupon ? { ...autoCoupon, auto: true } : null,
  )
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function toggleAddon(id: AddonId) {
    setSelectedAddons((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function applyCouponCode() {
    setCouponError('')
    const result = parseCoupon(couponInput)
    if (!result) { setCouponError('Cupom inválido ou expirado.'); return }
    setAppliedCoupon({ ...result, auto: false })
    setCouponInput('')
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError('')
  }

  // ── pricing ──
  const expressAdd   = prazo === '7dias' ? Math.round(basePrice * 0.5) : 0
  const meetingAdd   = extraMeeting ? 150 : 0
  const addonsTotal  = ADDONS.filter((a) => selectedAddons.has(a.id)).reduce((s, a) => s + a.price, 0)
  const subtotal     = basePrice + expressAdd + meetingAdd + addonsTotal
  // arredonda em centavos — arredondar em reais zera o desconto em preços baixos
  const discount     = appliedCoupon ? Math.round(subtotal * appliedCoupon.pct) / 100 : 0
  const finalPrice   = subtotal - discount

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm({
      projectName,
      briefing,
      reference,
      prazo,
      extraMeeting,
      selectedAddons: [...selectedAddons],
      couponCode: appliedCoupon?.code,
      discountPct: appliedCoupon?.pct,
      finalPrice,
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-3xl bg-inset border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '92vh' }}
      >
        {/* header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Configurar pedido</h2>
            <p className="text-xs text-muted mt-0.5">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-elevated transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* body */}
        <form id="pedido-form" onSubmit={handleSubmit} className="flex flex-1 overflow-hidden min-h-0">

          {/* ── left: project info ── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 border-r border-border">
            <SectionLabel>Sobre o projeto</SectionLabel>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">
                Nome do projeto <span className="text-brand">*</span>
              </label>
              <input
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Ex: Site da minha empresa"
                className="w-full h-10 px-3.5 rounded-xl bg-elevated border border-border text-foreground placeholder:text-faint text-sm focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">
                Briefing <span className="text-brand">*</span>
              </label>
              <textarea
                required
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder="Descreva o projeto, público-alvo, objetivos, estilo visual, cores preferidas..."
                rows={6}
                className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border text-foreground placeholder:text-faint text-sm focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-colors resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">
                URL de referência{' '}
                <span className="text-faint font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: exemplo.com ou o nome de um site que você gosta"
                className="w-full h-10 px-3.5 rounded-xl bg-elevated border border-border text-foreground placeholder:text-faint text-sm focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-colors"
              />
              <p className="text-[11px] text-faint">Algum site que você gosta e serve de inspiração.</p>
            </div>
          </div>

          {/* ── right: options + pricing ── */}
          <div className="w-72 shrink-0 overflow-y-auto p-6 flex flex-col gap-6">

            {/* prazo */}
            <div>
              <SectionLabel>Prazo de entrega</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { value: '14dias', icon: Clock, title: '14 dias', sub: 'Padrão', extra: 0 },
                  { value: '7dias',  icon: Zap,   title: '7 dias',  sub: 'Express', extra: Math.round(basePrice * 0.5) },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrazo(opt.value)}
                    className={[
                      'flex flex-col gap-1 p-3 rounded-xl border text-left transition-all',
                      prazo === opt.value
                        ? 'bg-brand/10 border-brand/40 text-foreground'
                        : 'bg-surface border-border text-secondary hover:border-border-strong',
                    ].join(' ')}
                  >
                    <opt.icon size={14} className={prazo === opt.value ? 'text-brand' : 'text-faint'} />
                    <span className="text-sm font-bold leading-none mt-0.5">{opt.title}</span>
                    <span className="text-[11px] opacity-60">{opt.sub}</span>
                    {opt.extra > 0 && (
                      <span className="text-xs font-semibold text-brand mt-0.5">+{fmt(opt.extra)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* reuniões */}
            <div>
              <SectionLabel>Reuniões de alinhamento</SectionLabel>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
                  <div className="w-5 h-5 rounded-md bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground">1ª reunião</p>
                    <p className="text-[11px] text-faint">Cortesia — inclusa no pedido</p>
                  </div>
                  <span className="text-xs font-semibold text-success shrink-0">Grátis</span>
                </div>

                <button
                  type="button"
                  onClick={() => setExtraMeeting((v) => !v)}
                  className={[
                    'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                    extraMeeting
                      ? 'bg-brand/10 border-brand/30'
                      : 'bg-surface border-border hover:border-border-strong',
                  ].join(' ')}
                >
                  <div className={[
                    'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                    extraMeeting ? 'bg-brand border-brand' : 'bg-elevated border-border-strong',
                  ].join(' ')}>
                    {extraMeeting && <Check size={11} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Video size={11} className="shrink-0" />
                      Reunião adicional
                    </p>
                    <p className="text-[11px] text-faint mt-0.5">
                      Sessão extra de alinhamento por videoconferência
                    </p>
                  </div>
                  <span className={['text-xs font-semibold shrink-0', extraMeeting ? 'text-brand' : 'text-muted'].join(' ')}>
                    +R$ 150
                  </span>
                </button>
              </div>
            </div>

            {/* add-ons */}
            <div>
              <SectionLabel>Adicionais</SectionLabel>
              <div className="space-y-2">
                {ADDONS.map((addon) => {
                  const active = selectedAddons.has(addon.id)
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon.id)}
                      className={[
                        'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                        active
                          ? 'bg-brand/10 border-brand/30'
                          : 'bg-surface border-border hover:border-border-strong',
                      ].join(' ')}
                    >
                      <div className={[
                        'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                        active ? 'bg-brand border-brand' : 'bg-elevated border-border-strong',
                      ].join(' ')}>
                        {active && <Check size={11} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <addon.icon size={11} className={active ? 'text-brand' : 'text-faint'} />
                          <span className="text-xs font-semibold text-foreground">{addon.label}</span>
                        </div>
                        <p className="text-[11px] text-faint mt-0.5 leading-relaxed">{addon.description}</p>
                      </div>
                      <span className={['text-xs font-semibold shrink-0 mt-0.5', active ? 'text-brand' : 'text-muted'].join(' ')}>
                        +{fmt(addon.price)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* serviços sob consulta */}
            <div>
              <SectionLabel>Serviços sob consulta</SectionLabel>
              <div className="space-y-2">
                {CONSULT_SERVICES.map((service) => (
                  <a
                    key={service.id}
                    href={whatsappUrl(service.message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-start gap-3 p-3 rounded-xl border bg-surface border-border hover:border-border-strong text-left transition-all group"
                  >
                    <div className="w-5 h-5 rounded-md bg-elevated border border-border-strong flex items-center justify-center shrink-0 mt-0.5">
                      <service.icon size={11} className="text-faint" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-foreground">{service.label}</span>
                      <p className="text-[11px] text-faint mt-0.5 leading-relaxed">{service.description}</p>
                    </div>
                    <span className="text-xs font-semibold shrink-0 mt-0.5 text-success flex items-center gap-0.5">
                      Consultar
                      <ArrowUpRight size={11} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </a>
                ))}
              </div>
              <p className="text-[10px] text-faint mt-2">
                Conversamos pelo WhatsApp para montar um plano sob medida.
              </p>
            </div>

            {/* coupon */}
            <div>
              <SectionLabel>Cupom de desconto</SectionLabel>

              {appliedCoupon ? (
                <div className={[
                  'flex items-center justify-between p-3 rounded-xl border',
                  appliedCoupon.auto
                    ? 'bg-green-500/10 border-green-500/25'
                    : 'bg-brand/10 border-brand/25',
                ].join(' ')}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag size={13} className={appliedCoupon.auto ? 'text-green-400 shrink-0' : 'text-brand shrink-0'} />
                    <div className="min-w-0">
                      <p className={['text-xs font-bold font-mono', appliedCoupon.auto ? 'text-green-400' : 'text-brand'].join(' ')}>
                        {appliedCoupon.code}
                      </p>
                      <p className="text-[10px] text-muted">
                        {appliedCoupon.auto ? 'Aplicado automaticamente' : 'Aplicado'} — {appliedCoupon.pct}% off
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="p-1 text-faint hover:text-secondary transition-colors shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCouponCode())}
                      placeholder="CÓDIGO DO CUPOM"
                      className="flex-1 h-9 px-3 rounded-xl bg-elevated border border-border text-foreground text-xs font-mono placeholder:text-faint focus:outline-none focus:border-brand/50 transition-colors uppercase"
                    />
                    <button
                      type="button"
                      onClick={applyCouponCode}
                      disabled={!couponInput.trim()}
                      className="h-9 px-3.5 rounded-xl bg-elevated hover:bg-elevated disabled:opacity-40 text-xs text-secondary font-semibold transition-colors shrink-0"
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-danger">{couponError}</p>}
                </div>
              )}
            </div>

            {/* price summary */}
            <div className="mt-auto pt-4 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">{productName}</span>
                <span className="text-secondary">{fmt(basePrice)}</span>
              </div>
              {expressAdd > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Express (7 dias)</span>
                  <span className="text-secondary">+{fmt(expressAdd)}</span>
                </div>
              )}
              {meetingAdd > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Reunião adicional</span>
                  <span className="text-secondary">+{fmt(meetingAdd)}</span>
                </div>
              )}
              {ADDONS.filter((a) => selectedAddons.has(a.id)).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted truncate mr-2">{a.label}</span>
                  <span className="text-secondary shrink-0">+{fmt(a.price)}</span>
                </div>
              ))}
              {discount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-success flex items-center gap-1">
                    <Tag size={10} />
                    Cupom {appliedCoupon?.code} (−{appliedCoupon?.pct}%)
                  </span>
                  <span className="text-success font-semibold">−{fmt(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <div className="text-right">
                  {discount > 0 && (
                    <p className="text-xs text-faint line-through">{fmt(subtotal)}</p>
                  )}
                  <p className="text-2xl font-bold text-brand">{fmt(finalPrice)}</p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-secondary hover:text-foreground hover:bg-elevated rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="pedido-form"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand/20 hover:shadow-brand/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            {initialData ? 'Salvar alterações' : 'Adicionar ao carrinho →'}
          </button>
        </div>
      </div>
    </div>
  )
}
