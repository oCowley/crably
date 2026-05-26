'use client'

import { useState, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import ScrollReveal from '@/components/ui/ScrollReveal'

const ITEMS = [
  {
    q: 'Quanto tempo leva para meu site ficar pronto?',
    a: 'O prazo padrao e de 14 dias. Com o pacote express, entregamos em 7 dias uteis.',
  },
  {
    q: 'Posso personalizar o template?',
    a: 'Sim! Personalizacoes dentro do escopo definido estao incluidas: cores, textos, imagens e logo. O escopo e claro desde o inicio.',
  },
  {
    q: 'Como funciona o pagamento?',
    a: 'O pagamento e feito via Abacate Pay, com checkout seguro. Voce paga e ja pode acompanhar o projeto pelo dashboard.',
  },
  {
    q: 'E se eu nao gostar do resultado?',
    a: 'Oferecemos garantia de 7 dias. Se nao estiver satisfeito, devolvemos 100% do valor. Sem perguntas.',
  },
  {
    q: 'Voces oferecem suporte apos a entrega?',
    a: 'Sim, suporte esta incluso apos a entrega para ajustes e duvidas sobre o site.',
  },
  {
    q: 'Qual a diferenca para um site feito do zero?',
    a: 'Nossos templates tem escopo fixo, prazo garantido e preco justo. Voce sabe exatamente o que vai receber, quando e por quanto.',
  },
]

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const toggle = useCallback((i: number) => {
    setOpenIdx((prev) => (prev === i ? null : i))
  }, [])

  return (
    <section id="faq" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal className="text-center mb-16">
          <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">FAQ</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            Perguntas frequentes
          </h2>
        </ScrollReveal>

        <div className="space-y-3">
          {ITEMS.map((item, i) => {
            const isOpen = openIdx === i
            return (
              <ScrollReveal key={i} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
                <div className="bento-card overflow-hidden">
                  <button
                    onClick={() => toggle(i)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold text-foreground">{item.q}</span>
                    <ChevronDown
                      size={18}
                      className="shrink-0 text-muted transition-transform duration-300"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-out"
                    style={{ maxHeight: isOpen ? '200px' : '0px', opacity: isOpen ? 1 : 0 }}
                  >
                    <p className="px-5 pb-5 text-sm text-secondary leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
