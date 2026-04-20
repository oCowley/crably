import Link from 'next/link'
import Image from 'next/image'
import {
  Zap,
  Sparkles,
  Palette,
  Smartphone,
  Lock,
  Rocket,
  CheckCircle,
  Gem,
  DollarSign,
  Radio,
  Target,
  ShieldCheck,
  Star,
  Users,
  Heart,
  Globe,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import ScrollReveal from '@/components/ui/ScrollReveal'
import SitesGrid from '@/components/sections/SitesGrid'

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

function BrowserMockup({
  url,
  accentColor,
  children,
  className = '',
}: {
  url: string
  accentColor: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl overflow-hidden border border-white/8 shadow-2xl shadow-black/60 ${className}`}>
      <div className="bg-[#161616] px-4 py-3 flex items-center gap-2.5 border-b border-white/5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
        <div className="flex-1 mx-4 bg-white/5 rounded-md h-5 flex items-center px-3">
          <span className="text-[10px] text-neutral-600 truncate">{url}</span>
        </div>
      </div>
      <div style={{ background: accentColor }} className="relative overflow-hidden">
        {children}
      </div>
    </div>
  )
}

const MARQUEE_ITEMS = [
  { icon: Zap, label: 'Express em 7 dias' },
  { icon: Sparkles, label: 'Preço fixo garantido' },
  { icon: Palette, label: 'Design profissional' },
  { icon: Smartphone, label: '100% responsivo' },
  { icon: Lock, label: 'Pagamento 100% adiantado' },
  { icon: Rocket, label: 'Entrega em 14 dias' },
  { icon: CheckCircle, label: 'Escopo fixo e claro' },
  { icon: Gem, label: 'Sites de alta conversão' },
]

const BENTO = [
  {
    size: 'col-span-2 row-span-1',
    title: 'Entregue em dias, não meses',
    desc: 'Do pagamento ao site no ar em até 14 dias. Com pacote express, em 7 dias.',
    icon: Zap,
    accent: true,
  },
  {
    size: 'col-span-1 row-span-1',
    title: 'Preço fixo',
    desc: 'Sem surpresas. Você sabe o valor antes de comprar.',
    icon: DollarSign,
    accent: false,
  },
  {
    size: 'col-span-1 row-span-1',
    title: 'Acompanhe em tempo real',
    desc: 'Dashboard com status do projeto atualizado em cada etapa.',
    icon: Radio,
    accent: false,
  },
  {
    size: 'col-span-1 row-span-1',
    title: 'Design de alta conversão',
    desc: 'Sites criados para converter visitantes em clientes.',
    icon: Target,
    accent: false,
  },
  {
    size: 'col-span-2 row-span-1',
    title: 'Sem dor de cabeça com freelancers',
    desc: 'Contrate, acompanhe e receba tudo em um único lugar. Processo garantido do início ao fim.',
    icon: ShieldCheck,
    accent: false,
  },
]

const STEPS = [
  { n: '01', title: 'Escolha o site', desc: 'Navegue pelo catálogo e encontre o estilo certo para o seu negócio.' },
  { n: '02', title: 'Finalize o pagamento', desc: 'Pagamento 100% adiantado via checkout seguro. Quer prioridade? Adicione o pacote express e receba em 7 dias.' },
  { n: '03', title: 'Acompanhe o projeto', desc: 'Acesse seu dashboard e veja cada etapa do desenvolvimento em tempo real.' },
  { n: '04', title: 'Receba seu site', desc: 'Site entregue em até 14 dias. Com pacote express, em 7 dias. Pronto para publicar.' },
]

/* ──────────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0B] overflow-x-hidden">
      <Header />

      {/* ══════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════== */}
      <section className="relative min-h-screen flex items-center overflow-hidden aurora-bg">

        {/* Noise overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]" aria-hidden>
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
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse at 30% 50%, black 30%, transparent 80%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 w-full pt-4 pb-12 lg:pb-0 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen">

          {/* LEFT: Copy */}
          <div className="z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand/20 bg-brand/5 mb-8 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <span className="text-sm font-medium text-brand">Desenvolvimento web · Entrega em 14 dias</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl xl:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
              <span className="block text-white overflow-hidden">
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
              className="text-lg md:text-xl text-neutral-400 max-w-lg leading-relaxed mb-10 animate-fade-up"
              style={{ animationDelay: '650ms' }}
            >
              A Crably desenvolve sites profissionais com entrega garantida em 14 dias, preço fixo e sem enrolação. Precisa de urgência? Entre na fila prioritária e receba em 7 dias.
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
                  Ver sites →
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full sm:w-auto text-neutral-300 border border-white/8 hover:border-white/20 text-base"
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
                { v: '100+', l: 'Projetos' },
                { v: '14 dias', l: 'Prazo padrão' },
                { v: '100%', l: 'Preço fixo' },
              ].map((s, i) => (
                <div key={i} className={i > 0 ? 'sm:border-l sm:border-white/8 sm:pl-6' : ''}>
                  <p className="text-2xl font-bold text-white">{s.v}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Floating mockups */}
          <div className="relative hidden lg:block h-screen pointer-events-none">

            {/* Mockup 1 — main */}
            <div
              className="absolute top-1/2 right-0 -translate-y-1/2 w-80 animate-float"
              style={{ animationDelay: '0s', animationDuration: '7s' }}
            >
              <BrowserMockup
                url="agencia.crably.io"
                accentColor="linear-gradient(135deg, #1a0a00, #2d1200)"
                className=""
              >
                <div className="p-5 h-52 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-6 w-3/4 rounded-lg bg-brand/20" />
                    <div className="h-3 w-full rounded bg-white/5" />
                    <div className="h-3 w-5/6 rounded bg-white/5" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-24 rounded-lg bg-brand/30" />
                    <div className="h-8 w-16 rounded-lg bg-white/5" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-16 rounded-lg bg-white/5" />
                    ))}
                  </div>
                </div>
              </BrowserMockup>
            </div>

            {/* Mockup 2 — upper */}
            <div
              className="absolute top-[18%] right-16 w-56 animate-float-rev"
              style={{ animationDelay: '1.5s', animationDuration: '9s' }}
            >
              <BrowserMockup
                url="saas.crably.io"
                accentColor="linear-gradient(135deg, #000d1a, #001433)"
                className="opacity-90"
              >
                <div className="p-4 h-36 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="h-4 w-2/3 rounded bg-blue-400/20" />
                    <div className="h-2.5 w-full rounded bg-white/5" />
                    <div className="h-2.5 w-4/5 rounded bg-white/5" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-12 rounded-lg bg-white/5 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-blue-400/20" />
                    </div>
                    <div className="h-12 rounded-lg bg-white/5" />
                  </div>
                </div>
              </BrowserMockup>
            </div>

            {/* Mockup 3 — lower */}
            <div
              className="absolute bottom-[18%] right-24 w-48 animate-float"
              style={{ animationDelay: '3s', animationDuration: '10s' }}
            >
              <BrowserMockup
                url="loja.crably.io"
                accentColor="linear-gradient(135deg, #0a0f00, #141f00)"
                className="opacity-80"
              >
                <div className="p-4 h-28 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="h-3 w-3/5 rounded bg-green-400/20" />
                    <div className="h-2 w-full rounded bg-white/5" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-10 rounded-lg bg-white/5" />
                    <div className="w-10 h-10 rounded-lg bg-green-400/20" />
                  </div>
                </div>
              </BrowserMockup>
            </div>

            {/* Glow behind mockups */}
            <div
              className="absolute top-1/2 right-20 -translate-y-1/2 w-72 h-72 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
                filter: 'blur(32px)',
              }}
            />
          </div>
        </div>
        
      </section>

      {/* ══════════════════════════════════════════════════════════
          MARQUEE STRIP
      ════════════════════════════════════════════════════════== */}
      <div className="border-y border-white/5 bg-[#0d0d0d] py-4 overflow-hidden">
        <div className="flex">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
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
            <h2 className="text-4xl md:text-5xl font-bold text-white max-w-2xl mx-auto">
              Tudo que você precisa,{' '}
              <span className="gradient-text-subtle">sem complicação</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">

            {/* Card 1 — wide */}
            <ScrollReveal delay={1} className="md:col-span-2">
              <div className="bento-card p-8 h-full min-h-[200px] relative overflow-hidden group">
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(249,115,22,0.06) 0%, transparent 60%)' }}
                />
                <div className="relative z-10">
                  <Zap size={36} className="mb-4 text-brand" />
                  <h3 className="text-xl font-bold text-white mb-2">Entregue em 14 dias, garantido</h3>
                  <p className="text-neutral-400 leading-relaxed">
                    Do pagamento ao site no ar em até 14 dias. Precisa antes? Ative o pacote express e receba em 7 dias, com fila prioritária.
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
              <div className="bento-card p-8 h-full min-h-[200px] group relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.05) 0%, transparent 70%)' }}
                />
                <DollarSign size={36} className="mb-4 text-brand" />
                <h3 className="text-xl font-bold text-white mb-2">Preço fixo</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Pagamento único, 100% adiantado. Sem surpresas, sem parcelamento, sem cobranças extras no final.
                </p>
                <p className="mt-4 text-3xl font-bold text-brand">R$ 997+</p>
              </div>
            </ScrollReveal>

            {/* Card 3 */}
            <ScrollReveal delay={1}>
              <div className="bento-card p-8 h-full min-h-[180px] group relative overflow-hidden">
                <Radio size={36} className="mb-4 text-brand" />
                <h3 className="text-xl font-bold text-white mb-2">Acompanhe em tempo real</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Dashboard com status atualizado a cada etapa do projeto.
                </p>
              </div>
            </ScrollReveal>

            {/* Card 4 */}
            <ScrollReveal delay={2}>
              <div className="bento-card p-8 h-full min-h-[180px] group relative overflow-hidden">
                <Target size={36} className="mb-4 text-brand" />
                <h3 className="text-xl font-bold text-white mb-2">Design que converte</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Sites criados para transformar visitantes em clientes.
                </p>
              </div>
            </ScrollReveal>

            {/* Card 5 — wide */}
            <ScrollReveal delay={3} className="md:col-span-1">
              <div className="bento-card p-8 h-full min-h-[180px] group relative overflow-hidden">
                <ShieldCheck size={36} className="mb-4 text-brand" />
                <h3 className="text-xl font-bold text-white mb-2">Sem dor de cabeça</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Contrate, acompanhe e receba tudo em um único lugar. Garantido.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TEMPLATES PREVIEW
      ════════════════════════════════════════════════════════== */}
      <section id="sites" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="mb-16">
            <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">Sites</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Feitos para converter
            </h2>
          </ScrollReveal>

          <SitesGrid />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════== */}
      <section id="como-funciona" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-20">
            <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">O processo</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">Do zero ao ar em 4 passos</h2>
          </ScrollReveal>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-brand/40 via-brand/10 to-transparent hidden md:block" />

            <div className="space-y-6">
              {STEPS.map((step, i) => (
                <ScrollReveal key={i} delay={(i % 4 + 1) as 1 | 2 | 3 | 4}>
                  <div className="flex gap-8 group">
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-dark-card border border-white/5 group-hover:border-brand/20 flex items-center justify-center transition-all duration-300 relative z-10">
                      <span className="text-lg font-bold gradient-text-subtle">{step.n}</span>
                    </div>
                    <div className="flex-1 py-3">
                      <h3 className="font-semibold text-white text-xl mb-2 group-hover:text-brand transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-neutral-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          AVALIAÇÕES
      ════════════════════════════════════════════════════════== */}
      <section id="avaliacoes" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">Avaliações</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              O que nossos clientes dizem
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Rafael Mendes',
                role: 'Fundador, AgênciaPulse',
                text: 'Entrega impecável. Em 6 dias tinha meu site no ar, com um design que minha equipe toda elogiou. Valeu cada centavo — sem estresse, sem revisão infinita.',
                stars: 5,
              },
              {
                name: 'Camila Ferreira',
                role: 'CEO, Loja Vista',
                text: 'Já tentei com dois freelas antes da Crably. A diferença é absurda. Processo claro, prazo cumprido e o resultado ficou muito acima do que eu esperava.',
                stars: 5,
              },
              {
                name: 'Bruno Alves',
                role: 'Co-founder, SaaSly',
                text: 'O dashboard de acompanhamento é incrível. Sabia o que estava acontecendo a cada etapa. Paguei, acompanhei e recebi o site no prazo combinado.',
                stars: 5,
              },
              {
                name: 'Juliana Costa',
                role: 'Diretora, Clínica Espaço Bem',
                text: 'Nunca imaginei que ter um site profissional fosse tão simples. Paguei, acompanhei pelo dashboard e recebi tudo pronto no prazo. Recomendo demais.',
                stars: 5,
              },
              {
                name: 'Thiago Rocha',
                role: 'Marketing, TechFlow',
                text: 'A relação custo-benefício é excelente. Preço fixo, pagamento único e o site entregue dentro do prazo. Processo direto, sem enrolação.',
                stars: 5,
              },
              {
                name: 'Mariana Lima',
                role: 'Empreendedora',
                text: 'Fiquei com medo no começo por ser online, mas a experiência superou tudo. Comunicação ativa, entrega no prazo e o site ficou lindo.',
                stars: 5,
              },
            ].map((review, i) => (
              <ScrollReveal key={i} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <div className="bento-card p-7 h-full flex flex-col gap-4">
                  <div className="flex gap-1">
                    {Array.from({ length: review.stars }).map((_, s) => (
                      <Star key={s} size={14} className="text-brand fill-brand" />
                    ))}
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed flex-1">"{review.text}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                    <Image
                      src={`https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(review.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`}
                      alt={review.name}
                      width={36}
                      height={36}
                      className="rounded-full shrink-0"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{review.name}</p>
                      <p className="text-xs text-neutral-500">{review.role}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SOBRE NÓS
      ════════════════════════════════════════════════════════== */}
      <section id="sobre" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <ScrollReveal>
            <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">Sobre nós</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              Nascemos para{' '}
              <span className="gradient-text">simplificar</span>{' '}
              a web.
            </h2>
            <p className="text-neutral-400 leading-relaxed mb-4">
              A Crably surgiu da frustração com um mercado cheio de promessas e poucas entregas. Freelancers que somem, agências que cobram caro demais e projetos que nunca terminam.
            </p>
            <p className="text-neutral-400 leading-relaxed mb-8">
              Nossa missão é simples: desenvolver sites profissionais com pagamento único, entrega em 14 dias e processo 100% transparente. Do pagamento ao site no ar — sem surpresas.
            </p>
            <div className="flex flex-wrap gap-6">
              {[
                { label: 'Projetos entregues', value: '120+' },
                { label: 'Clientes satisfeitos', value: '98%' },
                { label: 'Prazo padrão', value: '14 dias' },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-3xl font-bold text-white">{stat.value}</span>
                  <span className="text-sm text-neutral-500 mt-0.5">{stat.label}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={2}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Rocket, title: 'Velocidade', desc: 'Sites entregues em até 14 dias. Com pacote express, em 7 dias — sem abrir mão da qualidade.' },
                { icon: Heart, title: 'Cuidado', desc: 'Cada projeto é tratado como se fosse o nosso próprio negócio.' },
                { icon: Globe, title: 'Alcance', desc: 'Atendemos empreendedores em todo o Brasil, 100% remoto.' },
                { icon: ShieldCheck, title: 'Garantia', desc: 'Entrega garantida ou devolvemos seu dinheiro. Sem letras miúdas.' },
              ].map((item, i) => (
                <div key={i} className="bento-card p-6 flex flex-col gap-3">
                  <item.icon size={24} className="text-brand" />
                  <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          NOSSA EQUIPE
      ════════════════════════════════════════════════════════== */}
      <section id="equipe" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">Nossa equipe</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Pessoas reais por trás de cada projeto
            </h2>
            <p className="text-neutral-400 mt-4 max-w-xl mx-auto">
              Um time enxuto, especializado e apaixonado por entregar resultados de verdade.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Oliver Cowley', role: 'Fundador & CEO', bio: 'Apaixonado por produtos digitais e experiências que convertem.' },
              { name: 'Caio Guimarães', role: 'Design Lead', bio: 'Especialista em UI/UX com foco em interfaces de alta conversão.' },
              { name: 'Gustavo Pavaneli', role: 'Fundador & CO-CEO', bio: 'Fullstack sênior com experiência em entregas ágeis e escaláveis.' },
              { name: 'Fernanda Ramos', role: 'Customer Success', bio: 'Garante que cada cliente tenha a melhor experiência do início ao fim.' },
            ].map((member, i) => (
              <ScrollReveal key={i} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
                <div className="bento-card p-6 flex flex-col items-center text-center gap-4">
                  <Image
                    src={`https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(member.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&radius=12`}
                    alt={member.name}
                    width={64}
                    height={64}
                    className="rounded-2xl"
                  />
                  <div>
                    <p className="font-semibold text-white">{member.name}</p>
                    <p className="text-xs text-brand mt-0.5">{member.role}</p>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">{member.bio}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════════════════════════== */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="relative p-14 md:p-24 rounded-3xl bg-dark-card border border-white/5 text-center overflow-hidden">
              {/* Ambient glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 50% 120%, rgba(249,115,22,0.1) 0%, transparent 55%)',
                }}
              />
              {/* Bottom glow line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

              {/* Decorative spin ring */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-brand/5 animate-spin-slow pointer-events-none"
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-brand/5 pointer-events-none"
                style={{ animation: 'spin-slow 30s linear infinite reverse' }}
              />

              <div className="relative z-10">
                <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-6">
                  Pronto para começar?
                </p>
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                  Seu site está a{' '}
                  <span className="gradient-text">um clique</span>
                  <br />
                  de distância.
                </h2>
                <p className="text-lg text-neutral-400 mb-10 max-w-lg mx-auto">
                  Sem freelancers. Sem surpresas no preço. Pagamento único, site entregue em 14 dias — ou em 7 com prioridade express.
                </p>
                <Link href="/login?mode=register">
                  <Button
                    size="lg"
                    className="glow-brand-sm hover:scale-105 transition-transform text-base px-10"
                  >
                    Começar agora →
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}
