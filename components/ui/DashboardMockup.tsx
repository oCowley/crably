import Image from 'next/image'

/* ──────────────────────────────────────────────────────────────
   Hero visual: static dashboard mockup image (theme-aware).
   Dark/light variants are toggled via the `.dark` class so there
   is no hydration flash and no client-side JS.
────────────────────────────────────────────────────────────── */

export default function DashboardMockup() {
  return (
    <div className="relative hidden lg:flex items-center justify-center min-h-[460px]">
      {/* Ambient brand glow behind the mockup */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[560px] h-[560px] pointer-events-none animate-glow"
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.16) 0%, transparent 65%)',
          filter: 'blur(34px)',
        }}
      />

      <div
        className="relative animate-float w-full max-w-[600px]"
        style={{ animationDuration: '10s', filter: 'drop-shadow(0 24px 50px rgba(0,0,0,0.30))' }}
      >
        {/* Dark mode */}
        <Image
          src="/images/dark-note.png"
          alt="Dashboard de acompanhamento de vendas e pedidos da Crably"
          width={1448}
          height={1086}
          priority
          sizes="(min-width: 1024px) 600px, 100vw"
          className="hidden dark:block w-full h-auto"
        />
        {/* Light mode */}
        <Image
          src="/images/light-note.png"
          alt="Dashboard de acompanhamento de vendas e pedidos da Crably"
          width={1448}
          height={1086}
          sizes="(min-width: 1024px) 600px, 100vw"
          className="block dark:hidden w-full h-auto"
        />
      </div>
    </div>
  )
}
