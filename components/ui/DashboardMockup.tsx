import Image from 'next/image'

/* ──────────────────────────────────────────────────────────────
   Hero visual: static dashboard mockup image (theme-aware).
   Dark/light variants are toggled via the `.dark` class so there
   is no hydration flash and no client-side JS.

   variant="desktop" — coluna direita do hero (lg+), flutuando
   variant="mobile"  — bloco abaixo dos CTAs (<lg), com fade inferior
────────────────────────────────────────────────────────────── */

interface Props {
  variant?: 'desktop' | 'mobile'
}

function MockupImages({ sizes, priority }: { sizes: string; priority?: boolean }) {
  return (
    <>
      {/* Dark mode (tema padrão): eager + fetchPriority high porque é o LCP
          na primeira visita. A variante light continua lazy — quem usa light
          baixa a dark à toa (custo aceito), mas o LCP do tema padrão não
          espera o lazy loader. */}
      <Image
        src="/images/dashboard-dark.png"
        alt="Dashboard de acompanhamento de vendas e pedidos da Crably"
        width={1241}
        height={820}
        quality={80}
        loading={priority ? 'eager' : undefined}
        fetchPriority={priority ? 'high' : undefined}
        sizes={sizes}
        className="hidden dark:block w-full h-auto"
      />
      {/* Light mode */}
      <Image
        src="/images/dashboard-light.png"
        alt="Dashboard de acompanhamento de vendas e pedidos da Crably"
        width={1281}
        height={844}
        quality={80}
        sizes={sizes}
        className="block dark:hidden w-full h-auto"
      />
    </>
  )
}

export default function DashboardMockup({ variant = 'desktop' }: Props) {
  if (variant === 'mobile') {
    return (
      <div
        className="relative lg:hidden mt-2 mb-4 animate-fade-up"
        style={{ animationDelay: '850ms' }}
      >
        {/* Glow atrás do mockup */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(var(--brand-rgb),0.14) 0%, transparent 65%)',
            filter: 'blur(28px)',
          }}
        />
        <div
          className="relative max-w-[540px] mx-auto"
          style={{
            maskImage: 'linear-gradient(black 62%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(black 62%, transparent 100%)',
          }}
        >
          <MockupImages sizes="(min-width: 640px) 540px, 100vw" priority />
        </div>
      </div>
    )
  }

  return (
    <div className="relative hidden lg:flex items-center justify-center min-h-[520px] xl:min-h-[580px]">
      {/* Ambient brand glow behind the mockup */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[640px] h-[640px] pointer-events-none animate-glow"
        style={{
          background: 'radial-gradient(circle, rgba(var(--brand-rgb),0.16) 0%, transparent 65%)',
          filter: 'blur(34px)',
        }}
      />

      {/* Mais largo que a coluna (shrink-0 impede o flex de esmagar):
          o mockup "vaza" simetricamente de forma controlada — body tem
          overflow-x-hidden — ganhando presença no desktop */}
      <div
        className="relative animate-float corner-frame p-4 shrink-0 max-w-none w-[520px] xl:w-[740px] 2xl:w-[790px]"
        style={{ animationDuration: '10s', filter: 'drop-shadow(0 24px 50px rgba(0,0,0,0.30))' }}
      >
        <MockupImages sizes="(min-width: 1536px) 790px, (min-width: 1280px) 740px, (min-width: 1024px) 520px, 100vw" priority />
      </div>

      {/* Hairline "plataforma" com brilho central sob o notebook */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-4/5 hairline-glow" />
    </div>
  )
}
