import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone } from 'lucide-react'
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: '700' })

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto px-6 py-10">

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
                className="object-contain"
              />
              <span className={`${spaceGrotesk.className} text-white text-3xl tracking-tight`}>crably</span>
            </div>
            <p className="text-xs text-neutral-600 max-w-[220px] leading-relaxed">
              Sites premium prontos para lançar, a preço fixo e prazo real.
            </p>
            <div className="flex items-center gap-2">
              <a href="https://instagram.com/crably" target="_blank" rel="noopener noreferrer"
                className="w-7 h-7 rounded-md border border-white/8 flex items-center justify-center text-neutral-600 hover:text-neutral-300 hover:border-white/20 transition-all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="https://linkedin.com/company/crably" target="_blank" rel="noopener noreferrer"
                className="w-7 h-7 rounded-md border border-white/8 flex items-center justify-center text-neutral-600 hover:text-neutral-300 hover:border-white/20 transition-all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links groups */}
          <div className="flex flex-wrap gap-x-12 gap-y-6">

            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-1">Navegação</p>
              {[
                { href: '/#sites', label: 'Sites' },
                { href: '/#como-funciona', label: 'Como funciona' },
                { href: '/#vantagens', label: 'Por que a Crably' },
                { href: '/#avaliacoes', label: 'Avaliações' },
                { href: '/#sobre', label: 'Sobre nós' },
                { href: '/#equipe', label: 'Nossa equipe' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors">{label}</Link>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-1">Acesso</p>
              {[
                { href: '/login', label: 'Entrar' },
                { href: '/login?mode=register', label: 'Criar conta' },
                { href: '/dashboard', label: 'Minha área' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors">{label}</Link>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-1">Contato</p>
              <a href="mailto:contato@crably.com.br" className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-300 transition-colors">
                <Mail size={11} className="shrink-0" />contato@crably.com.br
              </a>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-300 transition-colors">
                <Phone size={11} className="shrink-0" />+55 (11) 9 9999-9999
              </a>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-neutral-700">© {new Date().getFullYear()} Crably. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacidade" className="text-[11px] text-neutral-700 hover:text-neutral-500 transition-colors">Política de Privacidade</Link>
            <Link href="/termos" className="text-[11px] text-neutral-700 hover:text-neutral-500 transition-colors">Termos de Uso</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
