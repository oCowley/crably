'use client'

import { useEffect, useRef } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  delay?: 0 | 1 | 2 | 3 | 4
  variant?: 'fade-up' | 'fade' | 'blur-up' | 'scale'
  /** Revela os filhos diretos em cascata (70ms entre cada) com um único observer */
  stagger?: boolean
}

const VARIANT_CLASS: Record<NonNullable<Props['variant']>, string> = {
  'fade-up': '',
  fade: 'sr-fade',
  'blur-up': 'sr-blur',
  scale: 'sr-scale',
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  variant = 'fade-up',
  stagger = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in-view')
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const delayClass = delay > 0 ? `delay-sr-${delay}` : ''
  const baseClass = stagger ? 'sr-stagger' : `scroll-reveal ${VARIANT_CLASS[variant]}`

  return (
    <div ref={ref} className={`${baseClass} ${delayClass} ${className}`}>
      {children}
    </div>
  )
}
