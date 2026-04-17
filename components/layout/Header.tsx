'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'

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
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-lg shadow-brand/30 group-hover:shadow-brand/50 transition-shadow">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">cowly</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/products"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Templates
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Como funciona
          </Link>
          <Link
            href="/login"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Entrar
          </Link>
        </nav>

        <Link href="/products">
          <Button size="sm">Começar agora</Button>
        </Link>
      </div>
    </header>
  )
}
