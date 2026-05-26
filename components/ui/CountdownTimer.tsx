'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  targetDate: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false })

  useEffect(() => {
    function calc() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
      }
    }

    setTimeLeft(calc())
    const interval = setInterval(() => setTimeLeft(calc()), 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (timeLeft.expired) {
    return <span className="text-sm font-bold text-secondary">Oferta encerrada</span>
  }

  const blocks = [
    { value: pad(timeLeft.days), label: 'd' },
    { value: pad(timeLeft.hours), label: 'h' },
    { value: pad(timeLeft.minutes), label: 'm' },
    { value: pad(timeLeft.seconds), label: 's' },
  ]

  return (
    <div className="flex items-center gap-1.5">
      {blocks.map((block, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-elevated border border-border text-sm font-bold text-foreground tabular-nums">
              {block.value}
            </span>
            <span className="text-[10px] text-muted font-medium">{block.label}</span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-faint text-sm font-bold">:</span>
          )}
        </div>
      ))}
    </div>
  )
}
