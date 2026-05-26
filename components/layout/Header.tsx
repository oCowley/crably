'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Space_Grotesk } from 'next/font/google'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/ui/ThemeToggle'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: '700' })


export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-brand focus:text-white focus:text-sm focus:font-semibold"
      >
        Pular para o conteudo
      </a>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-xl shadow-black/5 dark:shadow-black/20'
            : 'bg-transparent'
        }`}
      >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/images/icone-crably.png"
            alt="Crably"
            width={64}
            height={64}
            className="rounded-xl w-10 h-10 lg:w-12 lg:h-12 xl:w-16 xl:h-16"
          />
          <span className={`${spaceGrotesk.className} text-foreground text-2xl lg:text-3xl xl:text-4xl tracking-tight`}>crably</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">

         <span className="font-bold text-lg tracking-tight gradient-text-subtle">Software Development</span>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login?mode=register">
            <Button size="sm">Começar agora</Button>
          </Link>
        </div>
      </div>
      </header>
    </>
  )
}
