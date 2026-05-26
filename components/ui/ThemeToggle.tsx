'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-xl border border-border bg-surface/50 backdrop-blur-sm flex items-center justify-center hover:border-brand/30 hover:bg-elevated transition-all duration-300 cursor-pointer"
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      <Sun
        size={16}
        className={`absolute transition-all duration-500 ${
          isDark
            ? 'opacity-0 rotate-90 scale-0'
            : 'opacity-100 rotate-0 scale-100 text-amber-500'
        }`}
      />
      <Moon
        size={16}
        className={`absolute transition-all duration-500 ${
          isDark
            ? 'opacity-100 rotate-0 scale-100 text-blue-400'
            : 'opacity-0 -rotate-90 scale-0'
        }`}
      />
    </button>
  )
}
