'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Space_Grotesk } from 'next/font/google'
import Button from '@/components/ui/Button'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: '700' })


export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/images/icone-crably.png"
            alt="Crably"
            width={48}
            height={48}
            className="rounded-xl"
          />
          <span className={`${spaceGrotesk.className} text-white text-3xl tracking-tight`}>crably</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
        
         <span className="font-bold text-lg tracking-tight gradient-text-subtle">Software Development</span>
        </nav>

        <Link href="/login?mode=register">
          <Button size="sm">Começar agora</Button>
        </Link>
      </div>
    </header>
  )
}
