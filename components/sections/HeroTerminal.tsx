'use client'

import { useEffect, useState } from 'react'

const LINES: { text: string; color: string; bold?: boolean; pause?: boolean }[] = [
  { text: '$ iniciando novo pedido...', color: 'text-neutral-500' },
  { text: '> tipo: Landing Page', color: 'text-neutral-400' },
  { text: '> cliente: confirmado ✓', color: 'text-green-400' },
  { text: '> pagamento: aprovado ✓', color: 'text-green-400' },
  { text: '> briefing: analisado ✓', color: 'text-green-400' },
  { text: '> design: em construção...', color: 'text-orange-400', pause: true },
  { text: '> desenvolvimento: iniciado ✓', color: 'text-orange-400' },
  { text: '> responsividade: 100% ✓', color: 'text-green-400' },
  { text: '> testes: concluídos ✓', color: 'text-green-400' },
  { text: '> deploy: realizado ✓', color: 'text-green-400', pause: true },
  { text: '$ site no ar → crably.io/landing ✓', color: 'text-white', bold: true },
  { text: '  entregue em 6 dias.', color: 'text-orange-400', bold: true },
]

const CHAR_DELAY = 28
const LINE_DELAY = 420
const PAUSE_DELAY = 920
const RESTART_DELAY = 3200

export default function HeroTerminal() {
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChar, setCurrentChar] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => {
        setVisibleLines([])
        setCurrentLine(0)
        setCurrentChar(0)
        setDone(false)
      }, RESTART_DELAY)
      return () => clearTimeout(t)
    }

    if (currentLine >= LINES.length) {
      setDone(true)
      return
    }

    const line = LINES[currentLine]
    const fullText = line.text

    if (currentChar < fullText.length) {
      const t = setTimeout(() => {
        setCurrentChar((c) => c + 1)
      }, CHAR_DELAY)
      return () => clearTimeout(t)
    }

    // line complete
    const delay = line.pause ? PAUSE_DELAY : LINE_DELAY
    const t = setTimeout(() => {
      setVisibleLines((prev) => [...prev, fullText])
      setCurrentLine((l) => l + 1)
      setCurrentChar(0)
    }, delay)
    return () => clearTimeout(t)
  }, [currentLine, currentChar, done])

  const typingLine = !done && currentLine < LINES.length
    ? LINES[currentLine]
    : null

  return (
    <div className="relative hidden lg:flex flex-col items-end gap-4 h-screen justify-center pointer-events-none">

      {/* Terminal */}
      <div
        className="w-full max-w-md rounded-xl overflow-hidden border border-white/10"
        style={{ boxShadow: '0 0 60px rgba(249,115,22,0.12), 0 24px 48px rgba(0,0,0,0.6)' }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[#161616] border-b border-white/[0.06]">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57] shrink-0" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e] shrink-0" />
          <span className="w-3 h-3 rounded-full bg-[#28c840] shrink-0" />
          <span className="flex-1 text-center text-xs text-neutral-500 font-mono select-none">
            crably — entrega.sh
          </span>
        </div>

        {/* Body */}
        <div className="bg-[#0d0d0d] px-6 py-5 min-h-[320px] font-mono text-sm leading-relaxed">
          {/* Completed lines */}
          {visibleLines.map((text, i) => {
            const line = LINES[i]
            return (
              <div key={i} className={`${line.color} ${line.bold ? 'font-bold' : ''}`}>
                {text}
              </div>
            )
          })}

          {/* Currently typing line */}
          {typingLine && (
            <div className={`${typingLine.color} ${typingLine.bold ? 'font-bold' : ''}`}>
              {typingLine.text.slice(0, currentChar)}
              <span className="animate-pulse text-brand">▋</span>
            </div>
          )}

          {/* Idle cursor after all done */}
          {done && (
            <div className="mt-1">
              <span className="animate-pulse text-brand">▋</span>
            </div>
          )}
        </div>
      </div>

      {/* Badge */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
        <span className="text-green-400 text-xs font-mono">entrega em andamento</span>
      </div>

    </div>
  )
}
