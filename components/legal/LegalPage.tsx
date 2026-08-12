import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'

/* ──────────────────────────────────────────────────────────────
   Casca visual das páginas legais (Privacidade / Termos).
   Segue o padrão da landing: eyebrow mono, font-display,
   numeração técnica de seções e hairlines.
────────────────────────────────────────────────────────────── */

export type LegalSection = {
  title: string
  paragraphs?: string[]
  items?: string[]
  footnote?: string
}

interface Props {
  eyebrow: string
  title: string
  intro: string
  updated: string
  summaryTitle: string
  summary: string[]
  sections: LegalSection[]
  crossLink: { href: string; label: string }
}

export default function LegalPage({ eyebrow, title, intro, updated, summaryTitle, summary, sections, crossLink }: Props) {
  return (
    <div className="pt-28 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Cabeçalho */}
        <p className="eyebrow mb-4">{eyebrow}</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-foreground mb-5">
          {title}
        </h1>
        <p className="text-secondary leading-relaxed max-w-2xl">{intro}</p>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-widest text-faint">
          Última atualização — {updated}
        </p>

        {/* Resumo em linguagem simples */}
        <div className="mt-10 bento-card card-spotlight p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-faint mb-4">{summaryTitle}</p>
          <ul className="space-y-2.5">
            {summary.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-secondary leading-relaxed">
                <Check size={14} className="text-brand shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Seções numeradas */}
        <div className="mt-14 space-y-12">
          {sections.map((section, i) => (
            <section key={section.title}>
              <h2 className="flex items-baseline gap-3 font-display text-xl sm:text-2xl font-bold tracking-[-0.01em] text-foreground mb-4">
                <span className="font-mono text-xs font-medium text-brand tracking-[0.14em]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {section.title}
              </h2>
              {section.paragraphs?.map((p) => (
                <p key={p} className="text-[15px] text-secondary leading-relaxed mb-3">
                  {p}
                </p>
              ))}
              {section.items && (
                <ul className="space-y-2 mt-1 mb-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[15px] text-secondary leading-relaxed">
                      <span className="mt-[11px] w-3 h-px bg-brand/60 shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.footnote && (
                <p className="text-[13px] text-muted leading-relaxed mt-2">{section.footnote}</p>
              )}
            </section>
          ))}
        </div>

        {/* Rodapé da página */}
        <div className="hairline-glow mt-16" />
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-muted">
            Dúvidas? Fale com a gente em{' '}
            <a href="mailto:contato@crably.com.br" className="text-brand hover:text-brand-light transition-colors">
              contato@crably.com.br
            </a>
          </p>
          <Link
            href={crossLink.href}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-brand transition-colors"
          >
            {crossLink.label}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
