'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2, Pencil, ShoppingBag, QrCode, CreditCard } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import ConfigurarPedidoModal from '@/components/dashboard/ConfigurarPedidoModal'
import PixPaymentModal from '@/components/dashboard/PixPaymentModal'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { maskDocument } from '@/lib/masks'
import type { CartItem } from '@/types'

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export default function CarrinhoPage() {
  const { items, removeItem, updateItem, clearCart } = useCart()
  const { user, profile } = useAuth()

  const [editingItem, setEditingItem] = useState<CartItem | null>(null)
  const [isFirstPurchase, setIsFirstPurchase] = useState(false)
  const [checkingDiscount, setCheckingDiscount] = useState(true)
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix')
  const [pixData, setPixData] = useState<{
    paymentId: string
    qrCodeImage: string
    copiaECola: string
  } | null>(null)

  // Dados do comprador
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [loadingBuyer, setLoadingBuyer] = useState(true)

  useEffect(() => {
    if (!user) return

    async function init() {
      try {
        const [ordersSnap, userSnap] = await Promise.all([
          getDocs(
            query(collection(db, 'orders'), where('userId', '==', user!.uid))
          ),
          getDoc(doc(db, 'users', user!.uid)),
        ])

        // Pedidos não pagos (checkout abandonado) não consomem o desconto de primeira compra
        setIsFirstPurchase(
          !ordersSnap.docs.some((d) => d.data().status !== 'pending_payment')
        )

        if (userSnap.exists()) {
          const data = userSnap.data()
          setCpf((data.cpf as string) || '')
          setBirthDate((data.birthDate as string) || '')
        }
      } finally {
        setCheckingDiscount(false)
        setLoadingBuyer(false)
      }
    }

    init()
  }, [user])

  const subtotal = items.reduce((sum, item) => sum + item.finalPrice, 0)
  const discountRate = isFirstPurchase ? 0.15 : 0
  const discountAmount = Math.round(subtotal * discountRate * 100) / 100
  const total = subtotal - discountAmount

  const rawCpf = cpf.replace(/\D/g, '')
  const buyerDataComplete = (rawCpf.length === 11 || rawCpf.length === 14) && birthDate.length > 0

  function handleEditConfirm(data: {
    projectName: string
    briefing: string
    reference: string
    prazo: '14dias' | '7dias'
    finalPrice: number
  }) {
    if (!editingItem) return
    updateItem(editingItem.id, {
      projectName: data.projectName,
      briefing: data.briefing,
      reference: data.reference,
      prazo: data.prazo,
      finalPrice: data.finalPrice,
    })
    setEditingItem(null)
  }

  async function handleCheckout() {
    if (!user || items.length === 0 || !buyerDataComplete) return
    setLoading(true)
    setCheckoutError(null)
    try {
      // Persiste dados do comprador antes de ir ao pagamento (sem máscara)
      await setDoc(
        doc(db, 'users', user.uid),
        { cpf: cpf.replace(/\D/g, ''), birthDate, updatedAt: serverTimestamp() },
        { merge: true }
      )

      // Aplica desconto de primeira compra nos preços antes de enviar ao servidor
      const itemsWithDiscount = isFirstPurchase
        ? items.map((item) => ({
            ...item,
            finalPrice: Math.round(item.finalPrice * 0.85 * 100) / 100,
          }))
        : items

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsWithDiscount,
          userId: user.uid,
          userEmail: user.email ?? '',
          method: paymentMethod,
          buyerName: profile?.name ?? '',
          buyerCpf: rawCpf,
        }),
      })

      if (!res.ok) {
        setCheckoutError('Erro ao iniciar o pagamento. Tente novamente.')
        return
      }

      const data = (await res.json()) as {
        url?: string
        pix?: { paymentId: string; qrCodeImage: string; copiaECola: string }
        error?: string
      }

      if (data.pix) {
        // PIX transparente: QR Code no nosso site; carrinho só limpa após confirmar
        setPixData(data.pix)
      } else if (data.url) {
        // Cartão: redirect de página inteira para o checkout hospedado do Asaas
        // (iframe é bloqueado pelo X-Frame-Options: SAMEORIGIN do Asaas)
        setRedirecting(true)
        clearCart()
        window.location.assign(data.url)
      } else {
        setCheckoutError(data.error ?? 'Erro desconhecido. Tente novamente.')
      }
    } catch {
      setCheckoutError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (redirecting) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-secondary">Redirecionando para o pagamento seguro…</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Carrinho</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 bg-surface rounded-2xl border border-border text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-elevated flex items-center justify-center mb-5">
            <ShoppingBag size={24} className="text-faint" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Seu carrinho está vazio
          </h2>
          <p className="text-sm text-secondary mb-6">
            Adicione produtos para continuar.
          </p>
          <Link
            href="/dashboard/contratar"
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors"
          >
            Ver produtos →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Carrinho</h1>
        <p className="text-secondary mt-1 text-sm">
          {items.length} {items.length === 1 ? 'item' : 'itens'} no carrinho
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda: itens + dados do comprador */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          {items.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-surface rounded-2xl border border-border"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{item.productName}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-elevated text-xs text-secondary border border-border">
                      {item.prazo === '7dias' ? '7 dias express' : '14 dias'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-secondary mt-1">
                    {item.projectName}
                  </p>
                  <p className="text-sm text-muted mt-1 line-clamp-2">
                    {item.briefing}
                  </p>
                  {item.reference && (
                    <p className="text-xs text-faint mt-1 truncate">
                      Ref: {item.reference}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span className="text-lg font-bold text-brand">
                    {formatPrice(item.finalPrice)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-elevated transition-colors"
                      aria-label="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/5 transition-colors"
                      aria-label="Remover"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Dados do comprador */}
          <div className="p-5 bg-surface rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">
                Dados do comprador
              </h2>
              {!buyerDataComplete && !loadingBuyer && (
                <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg">
                  Obrigatório para continuar
                </span>
              )}
              {buyerDataComplete && (
                <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-lg">
                  ✓ Dados preenchidos
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Nome — bloqueado */}
              <div>
                <label className="block text-xs text-muted mb-1.5 uppercase tracking-wide">
                  Nome
                </label>
                <input
                  disabled
                  value={profile?.name ?? ''}
                  title="Nome definido no cadastro"
                  className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-faint text-sm cursor-not-allowed select-none"
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-xs text-muted mb-1.5 uppercase tracking-wide">
                  CPF ou CNPJ <span className="text-brand normal-case">*</span>
                </label>
                <input
                  value={cpf}
                  onChange={(e) => setCpf(maskDocument(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className="w-full h-9 px-3 rounded-lg bg-elevated border border-border-strong text-foreground placeholder:text-faint text-sm focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>

              {/* Data de nascimento */}
              <div>
                <label className="block text-xs text-muted mb-1.5 uppercase tracking-wide">
                  Nascimento <span className="text-brand normal-case">*</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-elevated border border-border-strong text-foreground text-sm focus:outline-none focus:border-brand/50 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <div className="p-5 bg-surface rounded-2xl border border-border sticky top-20">
            <h2 className="font-semibold text-foreground mb-4">Resumo do pedido</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-secondary">Subtotal</span>
                <span className="text-foreground">{formatPrice(subtotal)}</span>
              </div>

              {!checkingDiscount && isFirstPurchase && (
                <div className="flex items-center justify-between text-success">
                  <span>Desconto primeira compra (15%)</span>
                  <span>−{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-foreground font-semibold">Total</span>
                <span className="text-2xl font-bold text-brand">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {!checkingDiscount && isFirstPurchase && (
              <div className="mt-4 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-400 font-medium">
                  Parabéns! Você tem 15% de desconto na primeira compra.
                </p>
              </div>
            )}

            {/* Método de pagamento */}
            <div className="grid grid-cols-2 gap-2 mt-5">
              {([
                { value: 'pix', icon: QrCode, title: 'PIX', sub: 'Aprovação na hora' },
                { value: 'card', icon: CreditCard, title: 'Cartão', sub: 'Site do Asaas' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMethod(opt.value)}
                  className={[
                    'flex flex-col gap-0.5 p-3 rounded-xl border text-left transition-all',
                    paymentMethod === opt.value
                      ? 'bg-brand/10 border-brand/40 text-foreground'
                      : 'bg-surface border-border text-secondary hover:border-border-strong',
                  ].join(' ')}
                >
                  <opt.icon size={14} className={paymentMethod === opt.value ? 'text-brand' : 'text-faint'} />
                  <span className="text-sm font-bold leading-none mt-1">{opt.title}</span>
                  <span className="text-[11px] opacity-60">{opt.sub}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || !buyerDataComplete}
              className={[
                'w-full h-11 mt-3 rounded-xl text-white text-sm font-semibold transition-all duration-200',
                buyerDataComplete
                  ? 'bg-brand hover:bg-brand-hover shadow-[0_0_20px_rgba(var(--brand-rgb),0.3)] hover:shadow-[0_0_28px_rgba(var(--brand-rgb),0.45)]'
                  : 'bg-neutral-800 cursor-not-allowed text-muted',
                loading ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {loading
                ? 'Processando...'
                : paymentMethod === 'pix'
                  ? 'Gerar PIX →'
                  : 'Pagar com cartão →'}
            </button>

            {!buyerDataComplete && !loadingBuyer && (
              <p className="text-xs text-amber-400/80 text-center mt-2">
                Preencha CPF e data de nascimento
              </p>
            )}

            {checkoutError && (
              <p className="text-xs text-red-400 text-center mt-2 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {checkoutError}
              </p>
            )}

            <p className="text-xs text-faint text-center mt-3">
              Pagamento seguro via Asaas
            </p>
          </div>
        </div>
      </div>

      {/* PIX modal */}
      {pixData && (
        <PixPaymentModal
          paymentId={pixData.paymentId}
          qrCodeImage={pixData.qrCodeImage}
          copiaECola={pixData.copiaECola}
          onClose={() => setPixData(null)}
          onPaid={() => {
            clearCart()
            window.location.assign('/dashboard/projetos?success=true')
          }}
        />
      )}

      {/* Edit modal */}
      {editingItem && (
        <ConfigurarPedidoModal
          productName={editingItem.productName}
          productType={editingItem.productType}
          basePrice={editingItem.basePrice}
          initialData={{
            projectName: editingItem.projectName,
            briefing: editingItem.briefing,
            reference: editingItem.reference,
            prazo: editingItem.prazo,
          }}
          onClose={() => setEditingItem(null)}
          onConfirm={handleEditConfirm}
        />
      )}
    </div>
  )
}
