import Link from 'next/link'
import Image from 'next/image'
import {
  Zap,
  Rocket,
  DollarSign,
  Radio,
  Target,
  ShieldCheck,
  Star,
  Heart,
  Globe,
  Check,
  X as XIcon,
  ClipboardList,
  CreditCard as CreditCardIcon,
  Monitor,
  Upload,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import ScrollReveal from '@/components/ui/ScrollReveal'
import SitesGrid from '@/components/sections/SitesGrid'
import DashboardMockup from '@/components/ui/DashboardMockup'
import FAQ from '@/components/sections/FAQ'
import { WHATSAPP_URL } from '@/lib/constants'

// Trava explícita: a landing DEVE ser prerenderizada estática (TTFB via CDN).
// Se alguém introduzir uma API dinâmica aqui, o build falha em vez de degradar.
export const dynamic = 'force-static'

/* ──────────────────────────────────────────────────────────────
   Sub-components (server)
────────────────────────────────────────────────────────────── */

function WordReveal({ words, baseDelay = 0 }: { words: string[]; baseDelay?: number }) {
  return (
    <>
      {words.map((word, i) => (
        <span
          key={i}
          className="animate-word-reveal inline-block"
          style={{ animationDelay: `${baseDelay + i * 90}ms` }}
        >
          {word}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

function SpecSheet({ items }: { items: { v: string; l: string }[] }) {
  return (
    <div className="flex flex-wrap items-stretch gap-y-4">
      {items.map((s, i) => (
        <div key={i} className={`pr-6 ${i > 0 ? 'sm:border-l sm:border-border sm:pl-6' : ''}`}>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-1">{s.l}</p>
          <p className="font-display font-bold text-xl sm:text-2xl text-foreground">{s.v}</p>
        </div>
      ))}
    </div>
  )
}

function TickerContent({ hidden }: { hidden?: boolean }) {
  const items = [
    '15% OFF na primeira compra',
    'Entrega em até 14 dias úteis',
    'Preço fixo, sem surpresa',
    'Acompanhe cada etapa',
    'Pagamento seguro',
  ]
  return (
    <div className="flex shrink-0 animate-marquee items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span
          key={i}
          className="flex items-center font-mono text-xs uppercase tracking-[0.2em] text-secondary whitespace-nowrap"
        >
          <span className="px-6">{item}</span>
          <span className="text-brand">✦</span>
        </span>
      ))}
    </div>
  )
}

const STEPS = [
  { n: '01', title: 'Escolha o modelo ideal', desc: 'Veja os modelos disponíveis e escolha o tipo de site que faz mais sentido para sua empresa. Se tiver dúvida, use nosso chat para encontrar a melhor opção.', icon: ClipboardList },
  { n: '02', title: 'Finalize a contratação', desc: 'Veja o valor antes de contratar, aplique o desconto da primeira compra e finalize tudo com pagamento seguro.', icon: CreditCardIcon },
  { n: '03', title: 'Envie as informações do projeto', desc: 'Depois da contratação, você envia os dados da empresa, textos, referências e materiais necessários para começarmos.', icon: Upload },
  { n: '04', title: 'Acompanhe e receba seu site', desc: 'Acompanhe o andamento do projeto e receba seu site em até 14 dias úteis após o envio das informações necessárias.', icon: Monitor },
]

const REVIEWS = [
  {
    name: 'Rafael Mendes',
    role: 'Fundador, AgenciaPulse',
    site: 'Landing Page para agencia',
    text: 'Cara, em menos de uma semana o site ja estava no ar. Minha equipe ficou olhando e perguntando quem tinha feito. Nao esperava que fosse tao rapido e tao bem feito assim.',
    stars: 5,
    photo: '/images/reviews/rafael.jpg',
  },
  {
    name: 'Ana Paula Santos',
    role: 'Professora, Ensino Medio',
    site: 'Site institucional para aulas',
    text: 'Precisava de um site para divulgar minhas aulas particulares e fiquei impressionada com o resultado. Processo simples, entrega no prazo e meus alunos conseguem me encontrar facilmente.',
    stars: 4.5,
    photo: '/images/reviews/ana.jpg',
  },
  {
    name: 'Bruno Alves',
    role: 'Co-founder, SaaSly',
    site: 'SaaS Landing Page',
    text: 'O que mais me surpreendeu foi conseguir acompanhar tudo pelo dashboard. Cada etapa aparecendo la, sem precisar ficar mandando mensagem perguntando como tava.',
    stars: 5,
    photo: '/images/reviews/bruno.jpg',
  },
  {
    name: 'Juliana Costa',
    role: 'Diretora, Clinica Espaco Bem',
    site: 'Landing Page para clinica',
    text: 'Sempre achei que ter um site ia ser uma dor de cabeca enorme. Nao foi. Paguei, acompanhei pelo painel e quando percebi o site ja estava pronto. Simples assim.',
    stars: 5,
    photo: '/images/reviews/juliana.jpg',
  },
  {
    name: 'Thiago Rocha',
    role: 'Marketing, TechFlow',
    site: 'Portfolio para tech',
    text: 'Sem surpresa de preco no final, sem aquela enrolacao de "mais uma revisaozinha aqui". Pagou, combinou, entregou. Exatamente o que eu precisava.',
    stars: 5,
    photo: '/images/reviews/thiago.jpg',
  },
  {
    name: 'Mariana Lima',
    role: 'Empreendedora',
    site: 'E-commerce para moda',
    text: 'Confesso que fiquei receosa no comeco, nunca tinha contratado nada assim pela internet. Mas fui acompanhando tudo e quando o site ficou pronto eu falei "nossa, e isso". Adorei.',
    stars: 5,
    photo: '/images/reviews/mariana.jpg',
  },
]

const COMPARISON_ROWS = [
  { label: 'Preço', crably: 'Preço definido antes de contratar', freelancer: 'Pode variar conforme o projeto', agencia: 'Orçamento sob demanda' },
  { label: 'Prazo', crably: 'Até 14 dias úteis após envio das informações', freelancer: 'Depende da agenda', agencia: 'Geralmente mais longo' },
  { label: 'Processo', crably: 'Escolha o modelo, envie as infos e acompanhe', freelancer: 'Processo combinado caso a caso', agencia: 'Mais reuniões e etapas' },
  { label: 'Design', crably: 'Profissional e pensado para empresas B2B', freelancer: 'Pode variar conforme o profissional', agencia: 'Alta qualidade, com custo maior' },
  { label: 'Revisões', crably: 'Ajustes dentro do modelo contratado', freelancer: 'Depende do combinado', agencia: 'Limitadas ou cobradas à parte' },
  { label: 'Suporte', crably: 'Dúvidas pelo WhatsApp durante o projeto', freelancer: 'Depende da disponibilidade', agencia: 'Atendimento por canais definidos' },
  { label: 'Transparência', crably: 'Preço, prazo e etapas claras', freelancer: 'Pode ser mais informal', agencia: 'Processo mais robusto, porém mais lento' },
]

/* ──────────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <Header />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Crably',
            url: 'https://crably.com.br',
            description: 'Sites premium prontos para lancar',
            logo: 'https://crably.com.br/images/icone-crably.png',
          }),
        }}
      />

      <main id="main">
        {/* ══════════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════════== */}
        <section className="relative lg:min-h-screen flex items-center overflow-hidden aurora-bg">

          {/* Grid técnico com pan lento */}
          <div
            className="absolute inset-0 pointer-events-none tech-grid tech-grid-fade tech-grid-pan"
            style={{ '--grid-focus': '30% 45%' } as React.CSSProperties}
          />

          {/* Orb central com glow + parallax scroll-driven */}
          <div className="absolute inset-0 pointer-events-none hero-orb-drift">
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] animate-glow"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(var(--brand-rgb),0.10) 0%, rgba(var(--brand-rgb),0.04) 40%, transparent 70%)',
                filter: 'blur(24px)',
              }}
            />
          </div>

          {/* Linha de horizonte com beam */}
          <div className="absolute inset-x-0 top-[76%] hairline-glow beam-track pointer-events-none" />

          {/* Noise */}
          <div className="absolute inset-0 pointer-events-none noise-overlay" aria-hidden="true" />

          <div className="relative max-w-7xl mx-auto px-6 w-full pt-28 pb-16 lg:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 items-center lg:min-h-screen">

            {/* LEFT: Copy */}
            <div className="z-10">

              {/* Launch badge — tag segmentada estilo version tag */}
              <div
                className="badge-sheen inline-flex items-stretch rounded-full border border-brand/25 bg-surface/60 overflow-hidden shadow-glow-xs mb-6 animate-fade-up"
                style={{ animationDelay: '100ms' }}
              >
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand/10 border-r border-brand/20">
                  <Sparkles size={11} className="text-brand shrink-0" aria-hidden="true" />
                  <span className="font-mono text-[11px] font-bold text-foreground uppercase tracking-[0.14em]">Lançamento</span>
                </span>
                <span className="flex items-baseline gap-1.5 px-3.5 py-1.5">
                  <span className="font-mono text-[11px] font-bold text-foreground uppercase tracking-[0.14em]">15% off</span>
                  <span className="font-mono text-[11px] text-secondary uppercase tracking-[0.14em]">na 1ª compra</span>
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold tracking-[-0.03em] leading-[0.95] mb-8">
                <span className="block text-foreground overflow-hidden">
                  <WordReveal words={['Seu', 'site', 'no', 'ar', 'em', 'até']} baseDelay={200} />
                </span>
                <span className="block overflow-hidden mt-2">
                  <span
                    className="animate-word-reveal inline-block gradient-text-subtle"
                    style={{ animationDelay: '650ms' }}
                  >
                    2 semanas.
                  </span>
                </span>
              </h1>

              {/* Subtitle */}
              <p
                className="text-base lg:text-lg xl:text-xl text-secondary max-w-lg leading-relaxed mb-10 animate-fade-up"
                style={{ animationDelay: '650ms' }}
              >
                Sites profissionais para empresas B2B, com preço fixo, escolha simples e entrega em até 14 dias úteis após o envio das informações.
              </p>

              {/* CTAs */}
              <div
                className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-up"
                style={{ animationDelay: '780ms' }}
              >
                <Link href="/products">
                  <Button size="lg" className="w-full sm:w-auto cta-glow text-base px-8">
                    Ver modelos de site
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
                <Link href="#como-funciona">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base">
                    Me ajude a escolher
                  </Button>
                </Link>
              </div>

              {/* Mockup mobile (mesmos criativos, <lg) */}
              <DashboardMockup variant="mobile" />

              {/* Stats — spec sheet */}
              <div className="animate-fade-up" style={{ animationDelay: '900ms' }}>
                <SpecSheet
                  items={[
                    { v: 'Preço fixo', l: 'Sem surpresa' },
                    { v: '14 dias úteis', l: 'Prazo máximo' },
                    { v: '15% OFF', l: '1ª compra' },
                  ]}
                />
              </div>
            </div>

            {/* RIGHT: Dashboard mockup */}
            <DashboardMockup />
          </div>

        </section>

        {/* ══════════════════════════════════════════════════════════
            TICKER PROMO
        ════════════════════════════════════════════════════════== */}
        <section className="relative bg-inset overflow-hidden" aria-label="Condições de lançamento">
          <div className="hairline-glow" />
          <div className="flex items-center h-[52px] group">
            <div className="flex-1 flex overflow-hidden [&>div]:group-hover:[animation-play-state:paused]">
              <TickerContent />
              <TickerContent hidden />
            </div>
            <Link
              href="#sites"
              className="hidden sm:flex items-center gap-1.5 shrink-0 h-full px-6 font-mono text-xs uppercase tracking-[0.14em] text-brand hover:text-brand-light transition-colors border-l border-border bg-inset"
            >
              Ver modelos
              <ArrowRight size={12} />
            </Link>
          </div>
          <div className="hairline-glow" />
        </section>

        {/* ══════════════════════════════════════════════════════════
            01 — VANTAGENS (BENTO)
        ════════════════════════════════════════════════════════== */}
        <section id="vantagens" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal variant="blur-up" className="text-center mb-16">
              <p className="eyebrow mb-4">01 — Por que a Crably</p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.02em] text-foreground max-w-2xl mx-auto">
                Tudo para tirar seu site do papel,{' '}
                <span className="gradient-text-subtle">sem complicação</span>
              </h2>
            </ScrollReveal>

            <ScrollReveal stagger className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-fr">

              {/* Card A — wide com mini-pipeline */}
              <div className="md:col-span-4 bento-card card-spotlight border-gradient p-6 lg:p-8 relative min-h-[220px] flex flex-col">
                <span className="absolute top-6 right-6 font-mono text-xs text-faint">01</span>
                <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 shadow-glow-xs flex items-center justify-center mb-5">
                  <Zap size={22} className="text-brand" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Seu site no ar em até 14 dias úteis</h3>
                <p className="text-secondary leading-relaxed max-w-xl">
                  Após o envio das informações necessárias, criamos e entregamos seu site em até 14 dias úteis. Precisa antes? Ative o pacote Express e receba em até 7 dias úteis.
                </p>
                {/* Mini-pipeline */}
                <div className="mt-auto pt-6">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                    {['Pago', 'Fila', 'Produção', 'Entregue'].map((s) => (
                      <span key={s} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand/60" />
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="h-px bg-border beam-track" />
                </div>
              </div>

              {/* Card B */}
              <div className="md:col-span-2 bento-card card-spotlight p-6 lg:p-8 relative min-h-[220px]">
                <span className="absolute top-6 right-6 font-mono text-xs text-faint">02</span>
                <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 shadow-glow-xs flex items-center justify-center mb-5">
                  <DollarSign size={22} className="text-brand" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Preço fixo, sem orçamento escondido</h3>
                <p className="text-secondary text-sm leading-relaxed">
                  Você vê o valor antes de contratar. Sem reunião só para descobrir preço e sem cobrança surpresa no final.
                </p>
              </div>

              {/* Cards C, D, E */}
              {[
                { n: '03', icon: Radio, title: 'Acompanhe cada etapa', desc: 'Veja o status do projeto e saiba exatamente em que fase seu site está.' },
                { n: '04', icon: Target, title: 'Design que gera confiança', desc: 'Sites pensados para apresentar sua empresa com clareza, profissionalismo e foco em contato comercial.' },
                { n: '05', icon: ShieldCheck, title: 'Processo simples do início ao fim', desc: 'Escolha o modelo, envie as informações, acompanhe o projeto e receba seu site pronto.' },
              ].map((card) => (
                <div key={card.n} className="md:col-span-2 bento-card card-spotlight p-6 lg:p-8 relative min-h-[190px]">
                  <span className="absolute top-6 right-6 font-mono text-xs text-faint">{card.n}</span>
                  <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 shadow-glow-xs flex items-center justify-center mb-5">
                    <card.icon size={22} className="text-brand" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{card.title}</h3>
                  <p className="text-secondary text-sm leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </ScrollReveal>
          </div>
        </section>

        <div className="hairline-glow" />

        {/* ══════════════════════════════════════════════════════════
            02 — MODELOS (GALERIA)
        ════════════════════════════════════════════════════════== */}
        <section id="sites" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal className="mb-14">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="eyebrow mb-4">02 — Modelos de site</p>
                  <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.02em] text-foreground">
                    Escolha o site ideal para sua empresa
                  </h2>
                  <p className="mt-5 text-base sm:text-lg text-secondary leading-relaxed">
                    Selecione um modelo pronto para empresas B2B, veja o preço antes de contratar e receba seu site em até 14 dias úteis após o envio das informações.
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Não sabe qual escolher? Use nosso chat para encontrar a melhor opção.
                  </p>
                </div>
                <span className="badge badge-brand badge-tech shrink-0">15% off na 1ª compra</span>
              </div>
            </ScrollReveal>

            <SitesGrid />
          </div>
        </section>

        <div className="hairline-glow" />

        {/* ══════════════════════════════════════════════════════════
            03 — COMO FUNCIONA
        ════════════════════════════════════════════════════════== */}
        <section id="como-funciona" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal variant="blur-up" className="text-center mb-14">
              <p className="eyebrow mb-4">03 — O processo</p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.02em] text-foreground">
                Seu site pronto em 4 etapas simples
              </h2>
            </ScrollReveal>

            <div className="relative">
              {/* Trilho vertical com beam descendo */}
              <div className="absolute left-8 top-8 bottom-8 w-px hidden md:block bg-gradient-to-b from-brand/60 via-brand/25 to-transparent beam-track-y" />

              <ScrollReveal stagger className="space-y-6">
                {STEPS.map((step) => (
                  <div key={step.n} className="flex gap-4 sm:gap-8 group">
                    <div className="relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-surface border border-border group-hover:border-brand/40 group-hover:shadow-glow-xs flex items-center justify-center transition-all duration-300 z-10">
                      <step.icon size={24} className="text-brand" />
                      <span className="absolute -top-2 -right-2 font-mono text-[10px] text-brand bg-background border border-border rounded px-1 leading-relaxed">
                        {step.n}
                      </span>
                    </div>
                    <div className="flex-1 py-3">
                      <h3 className="font-semibold text-foreground text-xl sm:text-2xl mb-2 group-hover:text-brand transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-secondary leading-relaxed text-base sm:text-lg max-w-xl">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </ScrollReveal>
            </div>

            <div className="mt-14 flex justify-center">
              <Link href="#sites">
                <Button size="lg" className="text-base px-8">
                  Escolher meu modelo de site
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="hairline-glow" />

        {/* ══════════════════════════════════════════════════════════
            04 — COMPARAÇÃO (+ garantia embutida)
        ════════════════════════════════════════════════════════== */}
        <section id="comparacao" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal variant="blur-up" className="text-center mb-16">
              <p className="eyebrow mb-4">04 — Comparação</p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.02em] text-foreground">
                Por que escolher a Crably?
              </h2>
              <p className="mt-4 text-base sm:text-lg text-secondary max-w-2xl mx-auto leading-relaxed">
                Criamos sites profissionais com processo simples, preço claro e prazo definido desde o início.
              </p>
            </ScrollReveal>

            {/* Desktop table */}
            <ScrollReveal delay={1}>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-4 px-4 text-sm text-muted font-medium" />
                      <th className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1.5">
                          <span className="font-display text-sm font-bold text-brand">Crably</span>
                          <span className="badge badge-brand badge-tech">Recomendado</span>
                        </div>
                      </th>
                      <th className="py-4 px-4 text-sm font-semibold text-secondary text-center">Freelancer</th>
                      <th className="py-4 px-4 text-sm font-semibold text-secondary text-center">Agencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-4 px-4 text-base font-medium text-secondary">{row.label}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <Check size={16} className="text-success shrink-0" />
                            <span className="text-base text-foreground font-medium">{row.crably}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <XIcon size={16} className="text-faint shrink-0" />
                            <span className="text-base text-muted">{row.freelancer}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <XIcon size={16} className="text-faint shrink-0" />
                            <span className="text-base text-muted">{row.agencia}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {COMPARISON_ROWS.map((row, i) => (
                  <div key={i} className="bento-card p-4">
                    <p className="font-mono text-[11px] font-medium text-muted uppercase tracking-widest mb-3">{row.label}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 border-l-2 border-brand bg-brand/5 rounded-r-lg pl-3 pr-2 py-1.5 -ml-1">
                        <span className="text-sm font-bold text-brand shrink-0">Crably</span>
                        <span className="text-sm text-foreground text-right">{row.crably}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 pl-2">
                        <span className="text-sm text-muted shrink-0">Freelancer</span>
                        <span className="text-sm text-muted text-right">{row.freelancer}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 pl-2">
                        <span className="text-sm text-muted shrink-0">Agencia</span>
                        <span className="text-sm text-muted text-right">{row.agencia}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* Garantia — faixa embutida */}
            <ScrollReveal delay={2} className="mt-12">
              <div id="garantia" className="bento-card card-spotlight border-gradient p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-14 h-14 rounded-xl bg-brand/10 border border-brand/20 shadow-glow-xs flex items-center justify-center shrink-0">
                  <ShieldCheck size={26} className="text-brand" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-1">Contrate com segurança</h3>
                  <p className="text-sm text-secondary leading-relaxed max-w-xl">
                    Preço claro, pagamento seguro e acompanhamento durante todo o projeto. Você sabe o que contratou, em que etapa seu site está e quando vai receber.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {['Pagamento seguro', 'Preço fixo', 'Suporte WhatsApp'].map((label) => (
                    <span key={label} className="badge badge-outline badge-tech">{label}</span>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <div className="mt-12 flex justify-center">
              <Link href="#sites">
                <Button size="lg" className="cta-glow text-base px-8">
                  Começar agora com 15% OFF
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="hairline-glow" />

        {/* ══════════════════════════════════════════════════════════
            05 — AVALIAÇÕES
        ════════════════════════════════════════════════════════== */}
        <section id="avaliacoes" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal variant="blur-up" className="text-center mb-14">
              <p className="eyebrow mb-4">05 — Avaliações</p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.02em] text-foreground">
                O que nossos clientes dizem
              </h2>
              <span className="badge-sheen mt-5 inline-flex items-center gap-2.5 badge badge-outline badge-tech">
                <span className="flex items-center gap-[3px]" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <Star
                      key={n}
                      size={11}
                      className={`text-brand fill-brand ${n === 4 ? 'opacity-40' : ''}`}
                    />
                  ))}
                </span>
                <span className="font-bold text-foreground">4.9/5</span>
                <span>30+ projetos</span>
              </span>
            </ScrollReveal>

            <ScrollReveal stagger className="columns-1 md:columns-2 lg:columns-3 gap-5">
              {REVIEWS.map((review, i) => (
                <div key={i} className="bento-card card-spotlight p-6 mb-5 break-inside-avoid flex flex-col gap-3">
                  <span className="font-display text-5xl leading-none text-brand/20 select-none" aria-hidden="true">&ldquo;</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, s) => {
                      const filled = s < Math.floor(review.stars);
                      const half = !filled && s < review.stars;
                      return (
                        <span key={s} className="relative inline-block w-[14px] h-[14px]">
                          <Star size={14} className="text-faint fill-faint opacity-40" />
                          {(filled || half) && (
                            <span
                              className="absolute inset-0 overflow-hidden"
                              style={half ? { width: '50%' } : undefined}
                            >
                              <Star size={14} className="text-brand fill-brand" />
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-secondary text-sm leading-relaxed">&ldquo;{review.text}&rdquo;</p>
                  {review.site && (
                    <p className="font-mono text-[11px] uppercase tracking-widest text-brand/60">{review.site}</p>
                  )}
                  <div className="flex items-center gap-3 pt-3 border-t border-border-subtle">
                    <Image
                      src={review.photo}
                      alt={review.name}
                      width={36}
                      height={36}
                      className="rounded-full shrink-0 object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.name}</p>
                      <p className="text-xs text-muted">{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollReveal>
          </div>
        </section>

        <div className="hairline-glow" />

        {/* ══════════════════════════════════════════════════════════
            06 — QUEM SOMOS (Sobre + Equipe)
        ════════════════════════════════════════════════════════== */}
        <section id="sobre" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">

            {/* Ato 1 — Sobre */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <ScrollReveal>
                <p className="eyebrow mb-4">06 — Quem somos</p>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.02em] text-foreground leading-tight mb-6">
                  Nascemos para{' '}
                  <span className="gradient-text">simplificar</span>{' '}
                  a web.
                </h2>
                <p className="text-secondary leading-relaxed mb-4">
                  A Crably nasceu para ajudar empresas B2B a saírem do improviso digital com sites profissionais, preço claro e processo simples.
                </p>
                <p className="text-secondary leading-relaxed mb-4">
                  Em vez de projetos longos, reuniões desnecessárias e orçamentos confusos, criamos uma forma mais direta de colocar sua empresa no ar: escolha o modelo, envie as informações e acompanhe cada etapa até a entrega.
                </p>
                <p className="text-secondary leading-relaxed">
                  Nosso foco é entregar sites objetivos, bem construídos e prontos para gerar mais confiança no digital.
                </p>
              </ScrollReveal>

              <ScrollReveal stagger className="grid grid-cols-2 gap-4">
                {[
                  { icon: Rocket, title: 'Velocidade', desc: 'Seu site entregue em até 14 dias úteis após o envio das informações necessárias.' },
                  { icon: Heart, title: 'Cuidado', desc: 'Cada projeto é criado com atenção ao posicionamento, clareza e apresentação da sua empresa.' },
                  { icon: Globe, title: 'Alcance', desc: 'Atendimento 100% remoto para empresas em todo o Brasil.' },
                  { icon: ShieldCheck, title: 'Transparência', desc: 'Preço claro, etapas definidas e acompanhamento durante o projeto.' },
                ].map((item, i) => (
                  <div key={i} className="bento-card card-spotlight p-6 flex flex-col gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
                      <item.icon size={16} className="text-brand" />
                    </div>
                    <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                    <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </ScrollReveal>
            </div>

            {/* Ato 2 — Equipe */}
            <div id="equipe" className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mt-20 lg:mt-28">

              {/* Foto */}
              <ScrollReveal variant="scale">
                <div className="relative">
                  {/* Dot grid decorativo deslocado atrás */}
                  <div className="absolute -bottom-5 -left-5 w-full h-full dot-grid rounded-3xl -z-10" aria-hidden="true" />
                  <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl shadow-black/10 dark:shadow-black/60">
                    <Image
                      src="/images/crably.webp"
                      alt="Equipe Crably: Oliver Cowley (CTO), Guilherme Schmitz (CCO) e Gustavo Pavaneli (CMO)"
                      width={1397}
                      height={1126}
                      quality={80}
                      className="w-full h-full object-cover"
                    />
                    {/* Gradiente e badge no topo: o rodapé da foto já traz o lockup da marca */}
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 to-transparent pointer-events-none" />
                    <div className="absolute top-5 left-5 flex items-center gap-2 px-3 py-2 rounded-xl glass">
                      <span className="dot-live shrink-0" />
                      <span className="text-xs font-medium text-foreground">Time disponivel agora</span>
                    </div>
                  </div>
                  <div className="absolute -inset-px rounded-3xl corner-frame pointer-events-none" aria-hidden="true" />
                </div>
              </ScrollReveal>

              {/* Copy */}
              <ScrollReveal delay={1}>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.02em] text-foreground leading-tight mb-6">
                  Pode contar{' '}
                  <span className="gradient-text">com a gente.</span>
                </h2>
                <p className="text-secondary leading-relaxed mb-10">
                  Somos um time enxuto, direto e focado em entregar sites profissionais sem burocracia. Cada projeto é tratado com clareza, atenção aos detalhes e compromisso com o prazo combinado.
                </p>

                <div className="space-y-4 mb-10">
                  {[
                    { icon: Zap,        title: 'Rápido por padrão',     desc: 'Processo organizado para colocar seu site no ar sem atrasos desnecessários.' },
                    { icon: ShieldCheck, title: 'Confiável de verdade',  desc: 'Comunicação clara, etapas definidas e acompanhamento do início ao fim.' },
                    { icon: Rocket,     title: 'Ágil e sem burocracia', desc: 'Você escolhe o modelo, envia as informações e acompanha tudo de forma simples.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-surface border border-border hover:border-brand/25 hover:shadow-glow-xs transition-all duration-300">
                      <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                        <item.icon size={16} className="text-brand" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <SpecSheet
                  items={[
                    { v: '30+', l: 'Projetos entregues' },
                    { v: '14 dias úteis', l: 'Prazo máximo' },
                    { v: '15% OFF', l: '1ª compra' },
                  ]}
                />
              </ScrollReveal>

            </div>
          </div>
        </section>

        <div className="hairline-glow" />

        {/* ══════════════════════════════════════════════════════════
            07 — FAQ
        ════════════════════════════════════════════════════════== */}
        <FAQ />

        {/* ══════════════════════════════════════════════════════════
            CTA FINAL — full-bleed
        ════════════════════════════════════════════════════════== */}
        <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40 px-4 sm:px-6">
          <div className="hairline-glow absolute top-0 inset-x-0" />

          {/* Camadas de fundo */}
          <div
            className="absolute inset-0 pointer-events-none tech-grid tech-grid-fade"
            style={{ '--grid-focus': '50% 100%' } as React.CSSProperties}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 130%, rgba(var(--brand-rgb),0.18) 0%, transparent 60%)' }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full border border-brand/10 animate-spin-slow pointer-events-none" />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-brand/10 pointer-events-none"
            style={{ animation: 'spin-slow 30s linear infinite reverse' }}
          />
          <div className="absolute inset-0 pointer-events-none noise-overlay" aria-hidden="true" />

          <ScrollReveal className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="badge-sheen inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand/25 bg-brand/5 shadow-glow-xs mb-8">
              <Sparkles size={11} className="text-brand shrink-0" aria-hidden="true" />
              <span className="font-mono text-[11px] font-bold text-brand uppercase tracking-[0.14em]">Condição de lançamento</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold tracking-[-0.03em] text-foreground mb-6 leading-[1.02]">
              Seu site profissional{' '}
              <span className="gradient-text-subtle">começa aqui.</span>
            </h2>
            <p className="text-lg text-secondary mb-3 max-w-lg mx-auto">
              Escolha o modelo ideal, veja o preço antes de contratar e receba seu site em até 14 dias úteis após o envio das informações.
            </p>
            <p className="text-sm text-muted mb-10">
              Primeira compra com condição especial de lançamento.
            </p>
            <div className="flex flex-col items-center gap-5">
              <Link href="/login?mode=register">
                <Button size="xl" className="cta-glow text-base px-12">
                  Começar agora
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Prefere conversar antes? Chame no WhatsApp
                <Image src="/images/whatsapp.png" alt="" width={16} height={16} className="shrink-0" />
              </a>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <Footer />
    </div>
  )
}
