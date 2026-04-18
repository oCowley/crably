'use client'

import Link from 'next/link'
import { Menu, ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

interface Props {
  onMenuOpen: () => void
}

export default function DashboardHeader({ onMenuOpen }: Props) {
  const { items } = useCart()

  return (
    <header className="h-14 border-b border-white/5 bg-[#0B0B0B]/80 backdrop-blur-xl flex items-center justify-between px-5 lg:px-8 sticky top-0 z-20 shrink-0">
      <button
        onClick={onMenuOpen}
        className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      <div className="ml-auto">
        <Link
          href="/dashboard/carrinho"
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          aria-label={`Carrinho (${items.length} ${items.length === 1 ? 'item' : 'itens'})`}
        >
          <ShoppingCart size={20} />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand rounded-full flex items-center justify-center text-[10px] font-bold text-white leading-none">
              {items.length > 9 ? '9+' : items.length}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
