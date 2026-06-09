import Link from 'next/link'
import Image from 'next/image'
import {
  Zap,
  Sparkles,
  Palette,
  Smartphone,
  CreditCard,
  Rocket,
  CheckCircle,
  Gem,
  DollarSign,
  Radio,
  Target,
  ShieldCheck,
  Star,
  Heart,
  Globe,
  Flame,
  Check,
  X as XIcon,
  ClipboardList,
  CreditCard as CreditCardIcon,
  Monitor,
  Package,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import ScrollReveal from '@/components/ui/ScrollReveal'
import SitesGrid from '@/components/sections/SitesGrid'
import DashboardMockup from '@/components/ui/DashboardMockup'
import CountdownTimer from '@/components/ui/CountdownTimer'
import FAQ from '@/components/sections/FAQ'

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
          {i < words.length - 1 ? '\u00a0' : ''}
        </span>
      ))}
    </>
  )
}

const MARQUEE_ITEMS = [
  { icon: Zap, label: 'Pacote express: 7 dias' },
  { icon: Sparkles, label: 'Preco fixo garantido' },
  { icon: Palette, label: 'Design profissional' },
  { icon: Smartphone, label: '100% responsivo' },
  { icon: CreditCard, label: '30% off na 1a compra' },
  { icon: Rocket, label: 'Entrega em ate 14 dias' },
  { icon: CheckCircle, label: 'Escopo fixo e claro' },
  { icon: Gem, label: 'Sites de alta conversao' },
]

const STEPS = [
  { n: '01', title: 'Escolha o site', desc: 'Navegue pelo catalogo e encontre o estilo certo para o seu negocio.', icon: ClipboardList },
  { n: '02', title: 'Finalize o pagamento', desc: 'Checkout seguro via Abacate Pay. Primeira compra com 30% de desconto automatico. Quer prioridade? Adicione o pacote express.', icon: CreditCardIcon },
  { n: '03', title: 'Acompanhe o projeto', desc: 'Acesse seu dashboard e veja cada etapa do desenvolvimento em tempo real.', icon: Monitor },
  { n: '04', title: 'Receba seu site', desc: 'Site entregue em ate 14 dias. Com pacote express, em 7 dias. Pronto para publicar.', icon: Package },
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
  { label: 'Preco', crably: 'Fixo e acessivel', freelancer: 'Variavel', agencia: 'Alto' },
  { label: 'Prazo', crably: '14 dias garantidos', freelancer: 'Imprevisivel', agencia: '30-90 dias' },
  { label: 'Qualidade', crably: 'Design premium', freelancer: 'Inconsistente', agencia: 'Alta' },
  { label: 'Revisoes', crably: 'Dentro do escopo', freelancer: 'Infinitas idas e vindas', agencia: 'Limitadas e caras' },
  { label: 'Suporte', crably: 'Incluso', freelancer: 'Depende', agencia: 'Cobrado a parte' },
  { label: 'Transparencia', crably: 'Dashboard em tempo real', freelancer: 'Mensagens no WhatsApp', agencia: 'Reunioes semanais' },
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
        <section className="relative min-h-screen flex items-center overflow-hidden aurora-bg">

          {/* Noise overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 'var(--noise-opacity)' }} aria-hidden="true">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>

          {/* Ambient orbs */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none animate-glow"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.08) 0%, rgba(249,115,22,0.03) 40%, transparent 70%)',
              filter: 'blur(24px)',
            }}
          />
          <div
            className="absolute -left-32 top-1/3 w-[500px] h-[500px] rounded-full pointer-events-none animate-blob"
            style={{
              background: 'radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
              backgroundSize: '72px 72px',
              maskImage: 'radial-gradient(ellipse at 30% 50%, black 30%, transparent 80%)',
            }}
          />

          <div className="relative max-w-7xl mx-auto px-6 w-full pt-28 pb-12 lg:pb-0 grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 items-center min-h-screen">

            {/* LEFT: Copy */}
            <div className="z-10">

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-5xl xl:text-7xl 2xl:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
                <span className="block text-foreground overflow-hidden">
                  <WordReveal words={['Seu', 'site', 'no', 'ar', 'em']} baseDelay={200} />
                </span>
                <span className="block overflow-hidden mt-2">
                  <span
                    className="animate-word-reveal inline-block gradient-text"
                    style={{ animationDelay: '650ms' }}
                  >
                    14 dias.
                  </span>
                </span>
              </h1>

              {/* Subtitle */}
              <p
                className="text-base lg:text-lg xl:text-xl text-secondary max-w-lg leading-relaxed mb-10 animate-fade-up"
                style={{ animationDelay: '650ms' }}
              >
                Sites profissionais com preco fixo, entrega garantida em 14 dias e sem enrolacao. Sua primeira compra tem 30% de desconto.
              </p>

              {/* CTAs */}
              <div
                className="flex flex-col sm:flex-row gap-4 mb-16 animate-fade-up"
                style={{ animationDelay: '780ms' }}
              >
                <Link href="/products">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto glow-brand-sm text-base px-8 hover:scale-105 transition-transform"
                  >
                    Ver sites
                  </Button>
                </Link>
                <Link href="#como-funciona">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full sm:w-auto text-secondary border border-border hover:border-border-strong text-base"
                  >
                    Como funciona
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div
                className="flex flex-wrap items-center gap-6 animate-fade-up"
                style={{ animationDelay: '900ms' }}
              >
                {[
                  { v: '30+', l: 'Projetos entregues' },
                  { v: '14 dias', l: 'Prazo padrao' },
                  { v: '30%', l: 'Off na 1a compra' },
                ].map((s, i) => (
                  <div key={i} className={i > 0 ? 'sm:border-l sm:border-border sm:pl-6' : ''}>
                    <p className="text-2xl font-bold text-foreground">{s.v}</p>
                    <p className="text-xs text-muted mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Dashboard mockup */}
            <DashboardMockup />
          </div>

        </section>

        {/* ══════════════════════════════════════════════════════════
            MARQUEE STRIP
        ════════════════════════════════════════════════════════== */}
        <div className="border-y border-border bg-inset py-4 overflow-hidden" aria-hidden="true">
          <div className="flex">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="animate-marquee flex shrink-0 items-center"
              >
                {MARQUEE_ITEMS.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 text-sm font-semibold px-6 text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.7)]"
                  >
                    <item.icon size={14} />
                    {item.label}
                    <span className="mx-2 text-orange-400/30">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            BENTO GRID
        ════════════════════════════════════════════════════════== */}
        <section id="vantagens" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal className="text-center mb-16">
              <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">Por que a Crably</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground max-w-2xl mx-auto">
                Tudo que voce precisa,{' '}
                <span className="gradient-text-subtle">sem complicacao</span>
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">

              {/* Card 1 — wide */}
              <ScrollReveal delay={1} className="md:col-span-2">
                <div className="bento-card p-6 lg:p-8 h-full min-h-[200px] relative overflow-hidden group">
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(249,115,22,0.06) 0%, transparent 60%)' }}
                  />
                  <div className="relative z-10">
                    <Zap size={36} className="mb-4 text-brand" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Entregue em 14 dias, garantido</h3>
                    <p className="text-secondary leading-relaxed">
                      Do pagamento ao site no ar em ate 14 dias. Precisa antes? Ative o pacote express e receba em 7 dias.
                    </p>
                  </div>
                  <div className="absolute bottom-6 right-6 flex gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
                    {['paid', 'queued', 'in_progress', 'delivered'].map((s, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-brand"
                        style={{ animationDelay: `${i * 200}ms` }}
                      />
                    ))}
                    <div className="w-px h-6 bg-brand/40 mx-1" />
                  </div>
                </div>
              </ScrollReveal>

              {/* Card 2 */}
              <ScrollReveal delay={2}>
                <div className="bento-card p-6 lg:p-8 h-full min-h-[200px] group relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.05) 0%, transparent 70%)' }}
                  />
                  <DollarSign size={36} className="mb-4 text-brand" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Preco fixo, sem surpresas</h3>
                  <p className="text-secondary text-sm leading-relaxed">
                    Preco definido antes de comecar. Sem cobrancas extras. Primeira compra com 30% de desconto.
                  </p>
                </div>
              </ScrollReveal>

              {/* Card 3 */}
              <ScrollReveal delay={1}>
                <div className="bento-card p-6 lg:p-8 h-full min-h-[180px] group relative overflow-hidden">
                  <Radio size={36} className="mb-4 text-brand" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Acompanhe em tempo real</h3>
                  <p className="text-secondary text-sm leading-relaxed">
                    Dashboard com status atualizado a cada etapa do projeto.
                  </p>
                </div>
              </ScrollReveal>

              {/* Card 4 */}
              <ScrollReveal delay={2}>
                <div className="bento-card p-6 lg:p-8 h-full min-h-[180px] group relative overflow-hidden">
                  <Target size={36} className="mb-4 text-brand" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Design que converte</h3>
                  <p className="text-secondary text-sm leading-relaxed">
                    Sites criados para transformar visitantes em clientes.
                  </p>
                </div>
              </ScrollReveal>

              {/* Card 5 */}
              <ScrollReveal delay={3} className="md:col-span-1">
                <div className="bento-card p-6 lg:p-8 h-full min-h-[180px] group relative overflow-hidden">
                  <ShieldCheck size={36} className="mb-4 text-brand" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Sem dor de cabeca</h3>
                  <p className="text-secondary text-sm leading-relaxed">
                    Contrate, acompanhe e receba tudo em um unico lugar. Garantido.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            PROMO BANNER
        ════════════════════════════════════════════════════════== */}
        <section className="relative py-6 sm:py-8 px-4 sm:px-6 border-t border-brand/20 border-b border-b-brand/20 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.06) 50%, transparent 100%)',
            }}
          />
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center relative z-10">
            <div className="flex items-center gap-2">
              <span className="urgency-dot w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
              <span className="text-sm font-bold text-green-400 uppercase tracking-wider">Oferta ativa</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-brand shrink-0" />
              <span className="text-base sm:text-lg font-bold text-foreground">
                Primeira compra com <span className="text-brand">30% de desconto</span>
              </span>
            </div>
            <CountdownTimer targetDate="2025-12-31T23:59:59" />
            <Link
              href="#sites"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-sm font-semibold text-brand hover:bg-brand/20 transition-colors"
            >
              Ver ofertas
              <span className="text-xs">→</span>
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            TEMPLATE GALLERY
        ════════════════════════════════════════════════════════== */}
        <section id="sites" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal className="mb-16">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">Sites</p>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                    Feitos para converter
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand/20 bg-brand/5 shrink-0">
                  <Flame size={14} className="text-brand" />
                  <span className="text-sm font-semibold text-brand">30% off na 1a compra</span>
                </div>
              </div>
            </ScrollReveal>

            <SitesGrid />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════════════════════════════== */}
        <section id="como-funciona" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal className="text-center mb-20">
              <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">O processo</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">Do zero ao ar em 4 passos</h2>
            </ScrollReveal>

            <div className="relative">
              {/* Connecting line with gradient */}
              <div className="absolute left-8 top-8 bottom-8 w-px hidden md:block overflow-hidden">
                <div className="w-full h-full bg-gradient-to-b from-brand via-brand/40 to-transparent" />
              </div>

              <div className="space-y-6">
                {STEPS.map((step, i) => (
                  <ScrollReveal key={i} delay={(i % 4 + 1) as 1 | 2 | 3 | 4}>
                    <div className="flex gap-4 sm:gap-8 group">
                      <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-surface border border-border group-hover:border-brand/20 flex items-center justify-center transition-all duration-300 relative z-10">
                        <step.icon size={24} className="text-brand" />
                      </div>
                      <div className="flex-1 py-3">
                        <h3 className="font-semibold text-foreground text-xl mb-2 group-hover:text-brand transition-colors">
                          {step.title}
                        </h3>
                        <p className="text-secondary leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            GARANTIA
        ════════════════════════════════════════════════════════== */}
        <section id="garantia" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <div className="bento-card p-8 sm:p-12 text-center relative overflow-hidden border-brand/20">
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.06) 0%, transparent 60%)' }}
                />
                <div className="relative z-10">
                  <ShieldCheck size={48} className="mx-auto mb-6 text-brand" />
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Satisfacao garantida ou seu dinheiro de volta
                  </h2>
                  <p className="text-secondary leading-relaxed max-w-lg mx-auto mb-8">
                    Se em 7 dias voce nao estiver satisfeito, devolvemos 100% do valor. Sem perguntas.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {[
                      { icon: ShieldCheck, label: 'Pagamento seguro' },
                      { icon: Package, label: 'Entrega garantida' },
                      { icon: Heart, label: 'Suporte dedicado' },
                    ].map((badge, i) => (
                      <div key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-elevated border border-border">
                        <badge.icon size={14} className="text-brand" />
                        <span className="text-sm font-medium text-secondary">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            COMPARACAO
        ════════════════════════════════════════════════════════== */}
        <section id="comparacao" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal className="text-center mb-16">
              <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">Comparacao</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                Por que escolher a Crably?
              </h2>
            </ScrollReveal>

            {/* Desktop table */}
            <ScrollReveal delay={1}>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-4 px-4 text-sm text-muted font-medium" />
                      <th className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="text-sm font-bold text-brand">Crably</span>
                          <span className="text-[10px] font-semibold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">Melhor custo-beneficio</span>
                        </div>
                      </th>
                      <th className="py-4 px-4 text-sm font-semibold text-secondary text-center">Freelancer</th>
                      <th className="py-4 px-4 text-sm font-semibold text-secondary text-center">Agencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-4 px-4 text-sm font-medium text-secondary">{row.label}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <Check size={14} className="text-green-400 shrink-0" />
                            <span className="text-sm text-foreground font-medium">{row.crably}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <XIcon size={14} className="text-neutral-600 shrink-0" />
                            <span className="text-sm text-muted">{row.freelancer}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <XIcon size={14} className="text-neutral-600 shrink-0" />
                            <span className="text-sm text-muted">{row.agencia}</span>
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
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{row.label}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-brand">Crably</span>
                        <span className="text-sm text-foreground">{row.crably}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted">Freelancer</span>
                        <span className="text-sm text-muted">{row.freelancer}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted">Agencia</span>
                        <span className="text-sm text-muted">{row.agencia}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            AVALIACOES
        ════════════════════════════════════════════════════════== */}
        <section id="avaliacoes" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal className="text-center mb-16">
              <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">Avaliacoes</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                O que nossos clientes dizem
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {REVIEWS.map((review, i) => (
                <ScrollReveal key={i} delay={((i % 3) + 1) as 1 | 2 | 3}>
                  <div className="bento-card p-5 lg:p-7 h-full flex flex-col gap-4">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, s) => {
                        const filled = s < Math.floor(review.stars);
                        const half = !filled && s < review.stars;
                        return (
                          <span key={s} className="relative inline-block w-[14px] h-[14px]">
                            <Star size={14} className="text-neutral-700 fill-neutral-700" />
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
                    <p className="text-secondary text-sm leading-relaxed flex-1">&ldquo;{review.text}&rdquo;</p>
                    {review.site && (
                      <p className="text-xs text-brand/60 font-medium">{review.site}</p>
                    )}
                    <div className="flex items-center gap-3 pt-2 border-t border-border">
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
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SOBRE NOS
        ════════════════════════════════════════════════════════== */}
        <section id="sobre" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-border">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <ScrollReveal>
              <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">Sobre nos</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
                Nascemos para{' '}
                <span className="gradient-text">simplificar</span>{' '}
                a web.
              </h2>
              <p className="text-secondary leading-relaxed mb-4">
                A Crably surgiu da frustracao com um mercado cheio de promessas e poucas entregas. Freelancers que somem, agencias que cobram caro demais e projetos que nunca terminam.
              </p>
              <p className="text-secondary leading-relaxed mb-8">
                Nossa missao e simples: entregar sites profissionais com preco justo, prazo real de 14 dias e processo 100% transparente. Do pagamento ao site no ar — sem surpresas.
              </p>
              <div className="flex flex-wrap gap-6">
                {[
                  { label: 'Projetos entregues', value: '30+' },
                  { label: 'Entregas no prazo', value: '100%' },
                  { label: 'Prazo padrao', value: '14 dias' },
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                    <span className="text-sm text-muted mt-0.5">{stat.label}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={2}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Rocket, title: 'Velocidade', desc: 'Sites entregues em ate 14 dias. Com pacote express, em 7 dias — sem abrir mao da qualidade.' },
                  { icon: Heart, title: 'Cuidado', desc: 'Cada projeto e tratado como se fosse o nosso proprio negocio.' },
                  { icon: Globe, title: 'Alcance', desc: 'Atendemos empreendedores em todo o Brasil, 100% remoto.' },
                  { icon: ShieldCheck, title: 'Garantia', desc: 'Entrega garantida ou devolvemos seu dinheiro. Sem letras miudas.' },
                ].map((item, i) => (
                  <div key={i} className="bento-card p-6 flex flex-col gap-3">
                    <item.icon size={24} className="text-brand" />
                    <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                    <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            NOSSA EQUIPE
        ════════════════════════════════════════════════════════== */}
        <section id="equipe" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-border">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Foto */}
            <ScrollReveal>
              <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl shadow-black/10 dark:shadow-black/60">
                <Image
                  src="/images/owners.png"
                  alt="Equipe Crably"
                  width={720}
                  height={540}
                  quality={80}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                <div className="absolute bottom-5 left-5 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                  <span className="text-xs font-medium text-white">Time disponivel agora</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Copy */}
            <ScrollReveal delay={2}>
              <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">Nossa equipe</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
                Pode contar{' '}
                <span className="gradient-text">com a gente.</span>
              </h2>
              <p className="text-secondary leading-relaxed mb-10">
                Somos um time enxuto, agil e apaixonado por resultados reais. Cada projeto e tratado com seriedade, codigo limpo e entrega no prazo — sem desculpas.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { icon: Zap,        title: 'Rapido por padrao',     desc: 'Processos otimizados para entregar em 14 dias sem abrir mao da qualidade.' },
                  { icon: ShieldCheck, title: 'Confiavel de verdade',  desc: 'Compromisso com o prazo, preco fixo e comunicacao transparente do inicio ao fim.' },
                  { icon: Rocket,     title: 'Agil e sem burocracia', desc: 'Da contratacao ao site no ar com o minimo de atrito possivel para voce.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-elevated/30 border border-border hover:border-brand/20 transition-colors">
                    <div className="p-2 rounded-xl bg-brand/10 shrink-0">
                      <item.icon size={16} className="text-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-8">
                {[
                  { value: '30+', label: 'Projetos entregues' },
                  { value: '14 dias', label: 'Prazo garantido' },
                  { value: '30%', label: 'Off na 1a compra' },
                ].map((stat, i) => (
                  <div key={i}>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            FAQ
        ════════════════════════════════════════════════════════== */}
        <FAQ />

        {/* ══════════════════════════════════════════════════════════
            CTA FINAL
        ════════════════════════════════════════════════════════== */}
        <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="relative p-8 sm:p-14 md:p-24 rounded-3xl bg-surface border border-border text-center overflow-hidden">
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 120%, rgba(249,115,22,0.1) 0%, transparent 55%)',
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-brand/5 animate-spin-slow pointer-events-none"
                />
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-brand/5 pointer-events-none"
                  style={{ animation: 'spin-slow 30s linear infinite reverse' }}
                />

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-brand/30 bg-brand/10 mb-6 discount-badge">
                    <Flame size={16} className="text-brand" />
                    <span className="text-sm font-bold text-brand uppercase tracking-wide">30% off — Oferta ativa</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                    Seu site esta a{' '}
                    <span className="gradient-text">um clique</span>
                    <br />
                    de distancia.
                  </h2>
                  <p className="text-lg text-secondary mb-10 max-w-lg mx-auto">
                    Sem freelancers. Sem surpresas no preco. Sua primeira compra tem <span className="text-brand font-semibold">30% de desconto</span>. Site entregue em ate 14 dias.
                  </p>
                  <Link href="/login?mode=register">
                    <Button
                      size="lg"
                      className="glow-brand-sm hover:scale-105 transition-transform text-base px-10"
                    >
                      Comecar agora
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
