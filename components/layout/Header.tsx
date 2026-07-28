'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/ui/ThemeToggle'

const NAV_LINKS = [
  { href: '/#sites', label: 'Modelos' },
  { href: '/#como-funciona', label: 'Como funciona' },
  { href: '/#comparacao', label: 'Comparação' },
  { href: '/#faq', label: 'FAQ' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Scroll-lock enquanto o drawer mobile está aberto
  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-brand focus:text-white focus:text-sm focus:font-semibold"
      >
        Pular para o conteudo
      </a>

      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Container que vira cápsula flutuante ao scrollar */}
        <div
          className={`mx-auto flex items-center justify-between px-5 transition-all duration-400 ease-out ${
            scrolled
              ? 'max-w-5xl mt-3 h-14 rounded-full glass shadow-glow-xs'
              : 'max-w-7xl mt-0 h-20 bg-transparent border border-transparent'
          }`}
        >
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <Image
              src="/images/icone-crably.png"
              alt="Crably"
              width={64}
              height={64}
              className={`rounded-xl transition-all duration-400 ${scrolled ? 'w-8 h-8' : 'w-9 h-9 lg:w-10 lg:h-10'}`}
            />
            <span
              className={`font-display font-bold text-foreground tracking-tight transition-all duration-400 ${
                scrolled ? 'text-xl' : 'text-2xl'
              }`}
            >
              crably
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Navegação principal">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative text-sm text-secondary hover:text-foreground transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-px after:w-full after:bg-brand after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <Link href="/login" className="text-sm text-secondary hover:text-foreground transition-colors px-2">
              Entrar
            </Link>
            <Link href="/login?mode=register">
              <Button size="sm">Começar agora</Button>
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl text-foreground"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            <span
              className={`block w-5 h-0.5 rounded-full bg-current transition-all duration-300 ${
                menuOpen ? 'translate-y-1 rotate-45' : ''
              }`}
            />
            <span
              className={`block w-5 h-0.5 rounded-full bg-current transition-all duration-300 ${
                menuOpen ? '-translate-y-1 -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </header>

      {/* Drawer mobile full-screen */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-xl animate-pop-in flex flex-col pt-28 px-8 pb-10">
          <nav className="flex flex-col gap-6" aria-label="Navegação mobile">
            {NAV_LINKS.map(({ href, label }, i) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="font-display font-bold text-3xl text-foreground hover:text-brand transition-colors animate-fade-up"
                style={{ animationDelay: `${80 + i * 70}ms` }}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="font-display font-bold text-3xl text-secondary hover:text-brand transition-colors animate-fade-up"
              style={{ animationDelay: `${80 + NAV_LINKS.length * 70}ms` }}
            >
              Entrar
            </Link>
          </nav>

          <div className="mt-auto flex flex-col gap-4 animate-fade-up" style={{ animationDelay: '450ms' }}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted">Tema</span>
              <ThemeToggle />
            </div>
            <Link href="/login?mode=register" onClick={() => setMenuOpen(false)}>
              <Button size="lg" className="w-full">
                Começar agora
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
