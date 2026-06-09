import Image from 'next/image'

/* ──────────────────────────────────────────────────────────────
   Hero visual: static dashboard mockup image (desktop + phone).
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

      <div className="relative animate-float" style={{ animationDuration: '10s' }}>
        <Image
          src="/images/mockup-dashboard.png"
          alt="Dashboard de acompanhamento de vendas e pedidos da Crably"
          width={1414}
          height={1113}
          priority
          sizes="(min-width: 1024px) 560px, 100vw"
          className="w-full max-w-[560px] h-auto rounded-2xl border border-border"
          style={{ boxShadow: '0 30px 70px rgba(0,0,0,0.45)' }}
        />
      </div>
    </div>
  )
}
