import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone } from 'lucide-react'
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from '@/lib/constants'

export default function Footer() {
  return (
    <footer className="relative bg-background overflow-hidden">
      <div className="hairline-glow" />

      <div className="relative max-w-7xl mx-auto px-6 py-12 z-10">

        {/* Main row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">

          {/* Brand */}
          <div className="flex flex-col gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <Image
                src="/images/icone-crably.png"
                alt="Crably"
                width={80}
                height={80}
                className="object-contain w-14 h-14"
              />
              <span className="font-display font-bold text-foreground text-3xl tracking-tight">crably</span>
            </div>
            <p className="text-xs text-faint max-w-[220px] leading-relaxed">
              Sites premium prontos para lançar, a preço fixo e prazo real.
            </p>
            <div className="flex items-center gap-2">
              <a href="https://instagram.com/crably" target="_blank" rel="noopener noreferrer"
                className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-faint hover:text-brand hover:border-brand/30 transition-all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="https://linkedin.com/company/crably" target="_blank" rel="noopener noreferrer"
                className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-faint hover:text-brand hover:border-brand/30 transition-all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links groups */}
          <div className="flex flex-wrap gap-x-12 gap-y-6">

            <div className="flex flex-col gap-2">
              <p className="font-mono text-[10px] font-medium text-faint uppercase tracking-widest mb-1">Navegação</p>
              {[
                { href: '/#sites', label: 'Modelos de site' },
                { href: '/#como-funciona', label: 'Como funciona' },
                { href: '/#vantagens', label: 'Por que a Crably' },
                { href: '/#comparacao', label: 'Comparação' },
                { href: '/#avaliacoes', label: 'Avaliações' },
                { href: '/#sobre', label: 'Quem somos' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="text-xs text-faint hover:text-secondary transition-colors">{label}</Link>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-mono text-[10px] font-medium text-faint uppercase tracking-widest mb-1">Acesso</p>
              {[
                { href: '/login', label: 'Entrar' },
                { href: '/login?mode=register', label: 'Criar conta' },
                { href: '/dashboard', label: 'Minha área' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="text-xs text-faint hover:text-secondary transition-colors">{label}</Link>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-mono text-[10px] font-medium text-faint uppercase tracking-widest mb-1">Contato</p>
              <a href="mailto:contato@crably.com.br" className="flex items-center gap-1.5 text-xs text-faint hover:text-secondary transition-colors">
                <Mail size={11} className="shrink-0" />contato@crably.com.br
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-faint hover:text-secondary transition-colors">
                <Phone size={11} className="shrink-0" />{WHATSAPP_DISPLAY}
              </a>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-5 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-faint">
            © {new Date().getFullYear()} Crably — Feito no Brasil
          </p>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-faint">
              <span className="dot-live w-1.5 h-1.5" />
              Todos os sistemas operacionais
            </span>
            <Link href="/privacidade" className="text-[11px] text-faint hover:text-muted transition-colors">Privacidade</Link>
            <Link href="/termos" className="text-[11px] text-faint hover:text-muted transition-colors">Termos</Link>
          </div>
        </div>
      </div>

      {/* Watermark gigante */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute -bottom-[0.28em] left-1/2 -translate-x-1/2 font-display font-bold leading-none tracking-tight whitespace-nowrap text-[26vw] md:text-[19vw]"
        style={{
          color: 'transparent',
          WebkitTextStroke: '1px var(--border-color)',
          maskImage: 'linear-gradient(black, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(black, transparent 85%)',
        }}
      >
        crably
      </div>
    </footer>
  )
}
