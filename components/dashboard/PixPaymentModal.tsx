'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Copy, Check, QrCode } from 'lucide-react'

interface PixPaymentModalProps {
  paymentId: string
  qrCodeImage: string // PNG em base64 (sem o prefixo data:)
  copiaECola: string
  onClose: () => void
  onPaid: () => void
}

const POLL_INTERVAL_MS = 4000

export default function PixPaymentModal({
  paymentId,
  qrCodeImage,
  copiaECola,
  onClose,
  onPaid,
}: PixPaymentModalProps) {
  const [copied, setCopied] = useState(false)
  const [paid, setPaid] = useState(false)
  const onPaidRef = useRef(onPaid)
  onPaidRef.current = onPaid

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Verifica o pagamento no Asaas até confirmar
  useEffect(() => {
    let active = true

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: paymentId }),
        })
        const data = (await res.json()) as { status?: string }
        if (active && data.status === 'confirmed') {
          setPaid(true)
          clearInterval(interval)
          setTimeout(() => onPaidRef.current(), 1200)
        }
      } catch {
        // rede instável: tenta de novo no próximo ciclo
      }
    }, POLL_INTERVAL_MS)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [paymentId])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(copiaECola)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard bloqueado: usuário pode selecionar o texto manualmente
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={paid ? undefined : onClose} />

      <div className="relative w-full max-w-sm bg-inset border border-border-strong rounded-2xl shadow-2xl overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <QrCode size={15} className="text-brand" />
            <p className="text-sm font-semibold text-foreground">Pagar com PIX</p>
          </div>
          {!paid && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-elevated transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {paid ? (
          /* pago */
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
              <Check size={26} className="text-green-400" />
            </div>
            <p className="text-base font-bold text-foreground">Pagamento confirmado!</p>
            <p className="text-sm text-secondary mt-1">Redirecionando para seus projetos…</p>
          </div>
        ) : (
          /* aguardando */
          <div className="p-5">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${qrCodeImage}`}
                  alt="QR Code PIX"
                  width={208}
                  height={208}
                  className="w-52 h-52"
                />
              </div>
            </div>

            <p className="text-xs text-secondary text-center mt-4 leading-relaxed">
              Abra o app do seu banco, escaneie o QR Code
              <br />
              ou use o copia-e-cola abaixo.
            </p>

            {/* copia e cola */}
            <div className="flex gap-2 mt-4">
              <input
                readOnly
                value={copiaECola}
                onFocus={(e) => e.target.select()}
                className="flex-1 h-9 px-3 rounded-xl bg-elevated border border-border text-secondary text-[11px] font-mono truncate focus:outline-none focus:border-brand/50"
              />
              <button
                onClick={copyCode}
                className={[
                  'h-9 px-3.5 rounded-xl text-xs font-semibold transition-colors shrink-0 inline-flex items-center gap-1.5',
                  copied
                    ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                    : 'bg-brand hover:bg-brand-hover text-white',
                ].join(' ')}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            {/* status */}
            <div className="flex items-center justify-center gap-2 mt-5 pb-1">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <p className="text-xs text-muted">
                Aguardando pagamento — confirmação automática
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
