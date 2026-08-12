'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import ScrollReveal from '@/components/ui/ScrollReveal'
import Button from '@/components/ui/Button'
import { WHATSAPP_URL } from '@/lib/constants'

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
    <section id="faq" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-16 items-start">

        {/* Coluna esquerda — sticky */}
        <ScrollReveal className="lg:sticky lg:top-28">
          <p className="eyebrow mb-4">07 — FAQ</p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-foreground tracking-tight leading-tight mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-secondary leading-relaxed mb-8">
            Tudo o que você precisa saber antes de colocar seu site no ar.
          </p>

          <div className="bento-card card-spotlight p-6">
            <div className="w-11 h-11 rounded-xl bg-elevated border border-border shadow-glow-xs flex items-center justify-center mb-4">
              <Image src="/images/whatsapp.png" alt="" width={22} height={22} />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Ainda com dúvida?</h3>
            <p className="text-sm text-muted leading-relaxed mb-5">
              Fale com a gente no WhatsApp e receba ajuda para escolher o modelo ideal.
            </p>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" className="w-full">
                Chamar no WhatsApp
              </Button>
            </a>
          </div>
        </ScrollReveal>

        {/* Coluna direita — accordion contido */}
        <div className="bento-card overflow-hidden">
          <ScrollReveal stagger className="divide-y divide-border-subtle">
            {ITEMS.map((item, i) => {
              const isOpen = openIdx === i
              return (
                <div key={i} className="relative">
                  {/* Rail brand quando aberto */}
                  <span
                    className={`absolute left-0 top-0 bottom-0 w-0.5 bg-brand transition-opacity duration-300 ${
                      isOpen ? 'opacity-100 shadow-glow-xs' : 'opacity-0'
                    }`}
                    aria-hidden="true"
                  />
                  <button
                    onClick={() => toggle(i)}
                    className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left group"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`text-sm font-semibold transition-colors duration-200 ${
                        isOpen ? 'text-brand' : 'text-foreground group-hover:text-brand'
                      }`}
                    >
                      {item.q}
                    </span>
                    <Plus
                      size={16}
                      className={`shrink-0 transition-all duration-300 ${
                        isOpen ? 'rotate-45 text-brand' : 'text-muted'
                      }`}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-out"
                    style={{ maxHeight: isOpen ? '500px' : '0px', opacity: isOpen ? 1 : 0 }}
                  >
                    <p className="px-5 sm:px-6 pb-6 text-sm text-secondary leading-relaxed max-w-xl">{item.a}</p>
                  </div>
                </div>
              )
            })}
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
