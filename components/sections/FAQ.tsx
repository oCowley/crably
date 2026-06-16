'use client'

import { useState, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import ScrollReveal from '@/components/ui/ScrollReveal'

const ITEMS = [
  {
    q: 'Não sei qual modelo escolher. O que faço?',
    a: 'Você pode usar nosso chat para responder algumas perguntas rápidas e encontrar o modelo mais indicado para sua empresa.',
  },
  {
    q: 'O que está incluso no valor?',
    a: 'O valor inclui a criação do site dentro do modelo escolhido, personalização de textos, cores, imagens, logo e ajustes dentro do escopo contratado.',
  },
  {
    q: 'Como funciona o pagamento?',
    a: 'Você escolhe o modelo de site, visualiza o valor antes de contratar e finaliza o pagamento de forma segura. Na primeira compra, o desconto de 30% é aplicado conforme a oferta disponível.',
  },
  {
    q: 'O que preciso enviar para começar?',
    a: 'Após a contratação, você envia as informações da empresa, logo, textos, imagens, referências e dados de contato. Com isso, iniciamos a produção do site.',
  },
  {
    q: 'Quando começa a contar o prazo de entrega?',
    a: 'O prazo começa após a confirmação do pagamento e o envio das informações necessárias para iniciar o projeto.',
  },
  {
    q: 'Quanto tempo leva para meu site ficar pronto?',
    a: 'O prazo padrão é de até 14 dias úteis após o envio de todas as informações necessárias para iniciar o projeto. Com o pacote Express, a entrega pode ser feita em até 7 dias úteis.',
  },
  {
    q: 'Posso personalizar o modelo?',
    a: 'Sim. Personalizações dentro do escopo contratado estão incluídas, como cores, textos, imagens, logo e ajustes de conteúdo. Mudanças estruturais ou funcionalidades extras podem ser adicionadas como opcionais.',
  },
  {
    q: 'Posso pedir ajustes antes da entrega final?',
    a: 'Sim. Você pode solicitar ajustes dentro do escopo contratado para deixar o site alinhado com as informações enviadas e com o modelo escolhido.',
  },
  {
    q: 'Vocês oferecem suporte após a entrega?',
    a: 'Sim. Após a entrega, oferecemos suporte para dúvidas sobre o site e pequenos ajustes relacionados ao projeto entregue. Manutenções recorrentes, novas páginas ou alterações maiores podem ser contratadas à parte.',
  },
  {
    q: 'O site funciona no celular?',
    a: 'Sim. Todos os sites são responsivos e adaptados para desktop, tablet e celular.',
  },
  {
    q: 'Qual a diferença para um site feito do zero?',
    a: 'Nossos modelos têm estrutura pronta, escopo claro e preço fixo. Isso permite entregar mais rápido, com menos burocracia e sem orçamento surpresa. Um site feito do zero costuma ter prazo maior, mais etapas e investimento mais alto.',
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
          <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-4">Dúvidas frequentes</p>
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
                    style={{ maxHeight: isOpen ? '500px' : '0px', opacity: isOpen ? 1 : 0 }}
                  >
                    <div className="mx-5 border-t border-border/60" />
                    <p className="px-5 pt-4 pb-6 text-sm text-secondary leading-relaxed">{item.a}</p>
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
