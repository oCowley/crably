'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

type Token = { text: string; color: string }
type CodeLine = { tokens: Token[]; empty?: boolean; delayAfter: number }

// Syntax colors
const K = '#c792ea'  // keywords
const T = '#F97316'  // jsx tags
const A = '#80cbc4'  // attributes
const S = '#c3e88d'  // strings
const C = '#82aaff'  // component names
const P = '#eeffee'  // plain text
const CM = '#546e7a' // comments

const tk = (text: string, color: string): Token => ({ text, color })

const LINES: CodeLine[] = [
  { tokens: [tk('// hero.tsx — crably', CM)], delayAfter: 130 },
  { tokens: [tk('', P)], empty: true, delayAfter: 60 },
  { tokens: [tk('import', K), tk(' React ', P), tk('from', K), tk(" 'react'", S)], delayAfter: 130 },
  { tokens: [tk('', P)], empty: true, delayAfter: 60 },
  { tokens: [tk('export default function ', K), tk('Hero', C), tk('() {', P)], delayAfter: 130 },
  { tokens: [tk('  ', P), tk('return', K), tk(' (', P)], delayAfter: 280 },
  { tokens: [tk('    ', P), tk('<nav', T), tk(' className', A), tk('=', P), tk('"navbar"', S), tk('>', T)], delayAfter: 130 },
  { tokens: [tk('      ', P), tk('<Logo', C), tk(' />', T)], delayAfter: 130 },
  { tokens: [tk('      ', P), tk('<Button', C), tk('>', T), tk('Começar agora', P), tk('</Button>', T)], delayAfter: 130 },
  { tokens: [tk('    ', P), tk('</nav>', T)], delayAfter: 130 },
  { tokens: [tk('', P)], empty: true, delayAfter: 280 },
  { tokens: [tk('    ', P), tk('<section', T), tk(' className', A), tk('=', P), tk('"hero"', S), tk('>', T)], delayAfter: 130 },
  { tokens: [tk('      ', P), tk('<Badge', C), tk('>', T), tk('● Desenvolvimento web · 14 dias', P), tk('</Badge>', T)], delayAfter: 130 },
  { tokens: [tk('      ', P), tk('<h1', T), tk('>', T)], delayAfter: 130 },
  { tokens: [tk('        ', P), tk('Seu site no ar em até', P)], delayAfter: 130 },
  { tokens: [tk('        ', P), tk('<span', T), tk(' className', A), tk('=', P), tk('"orange"', S), tk('>', T), tk('2 semanas.', P), tk('</span>', T)], delayAfter: 130 },
  { tokens: [tk('      ', P), tk('</h1>', T)], delayAfter: 130 },
  { tokens: [tk('      ', P), tk('<p', T), tk('>', T), tk('Entrega garantida, preço fixo.', P), tk('</p>', T)], delayAfter: 280 },
  { tokens: [tk('      ', P), tk('<div', T), tk(' className', A), tk('=', P), tk('"btns"', S), tk('>', T)], delayAfter: 130 },
  { tokens: [tk('        ', P), tk('<Button', C), tk(' variant', A), tk('=', P), tk('"primary"', S), tk('>', T), tk('Ver sites →', P), tk('</Button>', T)], delayAfter: 130 },
  { tokens: [tk('        ', P), tk('<Button', C), tk(' variant', A), tk('=', P), tk('"ghost"', S), tk('>', T), tk('Como funciona', P), tk('</Button>', T)], delayAfter: 130 },
  { tokens: [tk('      ', P), tk('</div>', T)], delayAfter: 130 },
  { tokens: [tk('      ', P), tk('<Stats', C), tk(' data', A), tk('={stats} ', P), tk('/>', T)], delayAfter: 130 },
  { tokens: [tk('    ', P), tk('</section>', T)], delayAfter: 130 },
  { tokens: [tk('  )', P)], delayAfter: 130 },
  { tokens: [tk('}', P)], delayAfter: 130 },
]

const TOTAL_LINES = LINES.length // 26
const CHAR_DELAY = 28
const RESTART_DELAY = 2500

function lineFullText(line: CodeLine): string {
  return line.tokens.map((tok) => tok.text).join('')
}

function renderPartialTokens(tokens: Token[], charsToShow: number): Token[] {
  let remaining = charsToShow
  const result: Token[] = []
  for (const token of tokens) {
    if (remaining <= 0) break
    const showLen = Math.min(remaining, token.text.length)
    if (showLen > 0) result.push({ ...token, text: token.text.slice(0, showLen) })
    remaining -= showLen
  }
  return result
}

const FIRA: React.CSSProperties = {
  fontFamily: 'var(--font-fira-code), "Fira Code", monospace',
}

export default function LiveBuilder() {
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [done, setDone] = useState(false)
  const [fading, setFading] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-scroll editor to bottom as lines are added
  useEffect(() => {
    const el = editorRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lineIdx])

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => {
        setFading(true)
        fadeTimerRef.current = setTimeout(() => {
          setLineIdx(0)
          setCharIdx(0)
          setDone(false)
          setFading(false)
        }, 400)
      }, RESTART_DELAY)
      return () => {
        clearTimeout(t)
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
      }
    }

    if (lineIdx >= TOTAL_LINES) {
      setDone(true)
      return
    }

    const line = LINES[lineIdx]
    const fullText = lineFullText(line)

    if (charIdx < fullText.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), CHAR_DELAY)
      return () => clearTimeout(t)
    }

    const t = setTimeout(() => {
      setLineIdx((l) => l + 1)
      setCharIdx(0)
    }, line.delayAfter)
    return () => clearTimeout(t)
  }, [lineIdx, charIdx, done])

  const isTyping = !done && lineIdx < TOTAL_LINES
  const show = (triggerIdx: number) => lineIdx >= triggerIdx

  const displayLine = Math.min(lineIdx + 1, TOTAL_LINES)

  return (
    <div
      className="relative hidden lg:flex flex-col items-center justify-center pointer-events-none"
      style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.4s ease' }}
    >
      <div
        className="w-full max-w-[540px] rounded-2xl overflow-hidden border border-white/[0.08]"
        style={{
          background: '#0d0d0d',
          boxShadow: '0 0 60px rgba(249,115,22,0.08), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* ── Top bar ── */}
        <div
          className="flex items-center border-b border-white/5"
          style={{ background: '#111111', padding: '10px 16px' }}
        >
          <div className="flex items-center gap-[6px]">
            <span className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
            <span className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
            <span className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
          </div>
          <span
            className="flex-1 text-center text-neutral-500 select-none"
            style={{ ...FIRA, fontSize: '11px' }}
          >
            crably — hero.tsx
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400" style={{ ...FIRA, fontSize: '10px' }}>
              ao vivo
            </span>
          </div>
        </div>

        {/* ── Two panels ── */}
        <div className="grid grid-cols-2" style={{ minHeight: '320px' }}>

          {/* LEFT: Code editor */}
          <div
            ref={editorRef}
            className="border-r border-white/5 overflow-y-auto"
            style={{ background: '#0a0a0a', padding: '16px 14px', maxHeight: '320px', scrollBehavior: 'smooth' }}
          >
            {/* Completed lines */}
            {Array.from({ length: lineIdx > TOTAL_LINES ? TOTAL_LINES : lineIdx }, (_, i) => (
              <div key={i} className="flex items-start" style={{ lineHeight: '1.85' }}>
                <span
                  className="shrink-0 select-none text-right"
                  style={{ ...FIRA, fontSize: '11.5px', color: '#546e7a', minWidth: '20px', marginRight: '14px' }}
                >
                  {i + 1}
                </span>
                <span style={{ ...FIRA, fontSize: '11.5px' }}>
                  {LINES[i].tokens.map((tok, ti) => (
                    <span key={ti} style={{ color: tok.color }}>{tok.text}</span>
                  ))}
                </span>
              </div>
            ))}

            {/* Currently typing line */}
            {isTyping && (
              <div className="flex items-start" style={{ lineHeight: '1.85' }}>
                <span
                  className="shrink-0 select-none text-right"
                  style={{ ...FIRA, fontSize: '11.5px', color: '#546e7a', minWidth: '20px', marginRight: '14px' }}
                >
                  {lineIdx + 1}
                </span>
                <span style={{ ...FIRA, fontSize: '11.5px' }}>
                  {renderPartialTokens(LINES[lineIdx].tokens, charIdx).map((tok, ti) => (
                    <span key={ti} style={{ color: tok.color }}>{tok.text}</span>
                  ))}
                  <span className="animate-pulse" style={{ color: '#F97316' }}>▋</span>
                </span>
              </div>
            )}

            {/* Idle cursor when done */}
            {done && (
              <div className="flex items-start" style={{ lineHeight: '1.85' }}>
                <span style={{ ...FIRA, fontSize: '11.5px', minWidth: '20px', marginRight: '14px' }} />
                <span className="animate-pulse" style={{ ...FIRA, fontSize: '11.5px', color: '#F97316' }}>▋</span>
              </div>
            )}
          </div>

          {/* RIGHT: Preview */}
          <div className="relative overflow-hidden" style={{ background: '#ffffff', minHeight: '320px' }}>
            {/* Browser sub-bar */}
            <div
              className="flex items-center gap-2"
              style={{ background: '#f4f4f4', borderBottom: '1px solid #e5e5e5', padding: '6px 10px' }}
            >
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
                <span className="w-2 h-2 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <span
                  className="text-neutral-400 bg-[#e9e9e9] rounded-full px-3 py-0.5"
                  style={{ ...FIRA, fontSize: '10px' }}
                >
                  crably.com.br
                </span>
              </div>
            </div>

            {/* Preview content */}
            <div style={{ background: '#0B0B0B', minHeight: '290px' }}>

              {/* Navbar */}
              <div
                style={{
                  background: '#0B0B0B',
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  opacity: show(6) ? 1 : 0,
                  transform: show(6) ? 'translateY(0)' : 'translateY(6px)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Image src="/images/icone-crably.png" alt="Crably" width={20} height={20} />
                  <span
                    style={{
                      fontFamily: 'Space Grotesk, var(--font-geist-sans), sans-serif',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#ffffff',
                    }}
                  >
                    crably
                  </span>
                </div>
                <button
                  style={{
                    background: '#F97316',
                    color: '#fff',
                    fontSize: '9px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'default',
                  }}
                >
                  Começar agora
                </button>
              </div>

              {/* Hero section */}
              <div
                style={{
                  padding: '28px 20px',
                  background: '#0B0B0B',
                  opacity: show(11) ? 1 : 0,
                  transform: show(11) ? 'translateY(0)' : 'translateY(6px)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                }}
              >
                {/* Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'rgba(249,115,22,0.08)',
                    border: '1px solid rgba(249,115,22,0.19)',
                    borderRadius: '999px',
                    padding: '3px 10px',
                    marginBottom: '10px',
                    opacity: show(12) ? 1 : 0,
                    transform: show(12) ? 'translateY(0)' : 'translateY(6px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                  }}
                >
                  <span style={{ ...FIRA, fontSize: '8px', color: '#F97316' }}>
                    ● Desenvolvimento web · 14 dias
                  </span>
                </div>

                {/* H1 */}
                <div
                  style={{
                    marginBottom: '8px',
                    opacity: show(14) ? 1 : 0,
                    transform: show(14) ? 'translateY(0)' : 'translateY(6px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Space Grotesk, var(--font-geist-sans), sans-serif',
                      fontWeight: 700,
                      fontSize: '19px',
                      color: '#ffffff',
                      lineHeight: 1.2,
                    }}
                  >
                    Seu site no ar em até{' '}
                    <span style={{ color: '#F97316' }}>2 semanas.</span>
                  </span>
                </div>

                {/* Subtitle */}
                <p
                  style={{
                    fontSize: '9px',
                    color: '#737373',
                    marginBottom: '12px',
                    opacity: show(17) ? 1 : 0,
                    transform: show(17) ? 'translateY(0)' : 'translateY(6px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                  }}
                >
                  Entrega garantida, preço fixo.
                </p>

                {/* Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    marginBottom: '16px',
                    opacity: show(18) ? 1 : 0,
                    transform: show(18) ? 'translateY(0)' : 'translateY(6px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                  }}
                >
                  <button
                    style={{
                      background: '#F97316',
                      color: '#fff',
                      fontSize: '8px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      border: 'none',
                      boxShadow: '0 0 12px rgba(249,115,22,0.3)',
                      cursor: 'default',
                    }}
                  >
                    Ver sites →
                  </button>
                  <button
                    style={{
                      background: 'transparent',
                      color: '#a3a3a3',
                      fontSize: '8px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'default',
                    }}
                  >
                    Como funciona
                  </button>
                </div>

                {/* Stats */}
                <div
                  style={{
                    display: 'flex',
                    opacity: show(22) ? 1 : 0,
                    transform: show(22) ? 'translateY(0)' : 'translateY(6px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                  }}
                >
                  {[
                    { v: '30+', l: 'Projetos' },
                    { v: '14d', l: 'Prazo padrão' },
                    { v: '30%', l: '1ª compra off' },
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        paddingLeft: i > 0 ? '12px' : '0',
                        paddingRight: i < 2 ? '12px' : '0',
                        borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      }}
                    >
                      <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '11px', margin: 0 }}>{s.v}</p>
                      <p style={{ color: '#525252', fontSize: '8px', margin: '2px 0 0' }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          className="flex items-center justify-between border-t border-white/5"
          style={{ background: '#111', padding: '8px 16px' }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
              style={{ background: done ? '#4ade80' : '#F97316' }}
            />
            <span
              style={{
                ...FIRA,
                fontSize: '10px',
                color: done ? '#4ade80' : '#737373',
                transition: 'color 0.3s ease',
              }}
            >
              {done ? '✓ build concluído — pronto para deploy' : 'digitando código...'}
            </span>
          </div>
          <span style={{ ...FIRA, fontSize: '10px', color: '#525252' }}>
            linha {displayLine} / {TOTAL_LINES}
          </span>
        </div>
      </div>
    </div>
  )
}
