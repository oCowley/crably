'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2, Pencil, ShoppingBag } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import ConfigurarPedidoModal from '@/components/dashboard/ConfigurarPedidoModal'
import {
  collection,
  query,
  where,
  limit,
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
    maximumFractionDigits: 0,
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
            query(collection(db, 'orders'), where('userId', '==', user!.uid), limit(1))
          ),
          getDoc(doc(db, 'users', user!.uid)),
        ])

        setIsFirstPurchase(ordersSnap.empty)

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
  const discountRate = isFirstPurchase ? 0.3 : 0
  const discountAmount = Math.round(subtotal * discountRate)
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
      // Persiste dados do comprador antes de ir ao Stripe (sem máscara)
      await setDoc(
        doc(db, 'users', user.uid),
        { cpf: cpf.replace(/\D/g, ''), birthDate, updatedAt: serverTimestamp() },
        { merge: true }
      )

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          userId: user.uid,
          userEmail: user.email ?? '',
        }),
      })

      if (!res.ok) {
        setCheckoutError('Erro ao iniciar o pagamento. Tente novamente.')
        return
      }

      const data = (await res.json()) as { url?: string; error?: string }

      if (data.url) {
        clearCart()
        window.location.href = data.url
      } else {
        setCheckoutError(data.error ?? 'Erro desconhecido. Tente novamente.')
      }
    } catch {
      setCheckoutError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Carrinho</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 bg-[#111111] rounded-2xl border border-white/5 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
            <ShoppingBag size={24} className="text-neutral-600" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            Seu carrinho está vazio
          </h2>
          <p className="text-sm text-neutral-400 mb-6">
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
        <h1 className="text-2xl font-bold text-white">Carrinho</h1>
        <p className="text-neutral-400 mt-1 text-sm">
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
              className="p-5 bg-[#111111] rounded-2xl border border-white/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white">{item.productName}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-neutral-400 border border-white/5">
                      {item.prazo === '7dias' ? '7 dias express' : '14 dias'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-300 mt-1">
                    {item.projectName}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                    {item.briefing}
                  </p>
                  {item.reference && (
                    <p className="text-xs text-neutral-600 mt-1 truncate">
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
                      className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
                      aria-label="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-400/5 transition-colors"
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
          <div className="p-5 bg-[#111111] rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">
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
                <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Nome
                </label>
                <input
                  disabled
                  value={profile?.name ?? ''}
                  title="Nome definido no cadastro"
                  className="w-full h-9 px-3 rounded-lg bg-white/[0.02] border border-white/5 text-neutral-600 text-sm cursor-not-allowed select-none"
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wide">
                  CPF ou CNPJ <span className="text-brand normal-case">*</span>
                </label>
                <input
                  value={cpf}
                  onChange={(e) => setCpf(maskDocument(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>

              {/* Data de nascimento */}
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wide">
                  Nascimento <span className="text-brand normal-case">*</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand/50 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <div className="p-5 bg-[#111111] rounded-2xl border border-white/5 sticky top-20">
            <h2 className="font-semibold text-white mb-4">Resumo do pedido</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Subtotal</span>
                <span className="text-white">{formatPrice(subtotal)}</span>
              </div>

              {!checkingDiscount && isFirstPurchase && (
                <div className="flex items-center justify-between text-green-400">
                  <span>Desconto primeira compra (30%)</span>
                  <span>−{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-white font-semibold">Total</span>
                <span className="text-2xl font-bold text-brand">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {!checkingDiscount && isFirstPurchase && (
              <div className="mt-4 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-400 font-medium">
                  Parabéns! Você tem 30% de desconto na primeira compra.
                </p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading || !buyerDataComplete}
              className={[
                'w-full h-11 mt-5 rounded-xl text-white text-sm font-semibold transition-all duration-200',
                buyerDataComplete
                  ? 'bg-brand hover:bg-brand-hover shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_28px_rgba(249,115,22,0.45)]'
                  : 'bg-neutral-800 cursor-not-allowed text-neutral-500',
                loading ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {loading ? 'Processando...' : 'Finalizar pedido →'}
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

            <p className="text-xs text-neutral-600 text-center mt-3">
              Pagamento seguro via Stripe
            </p>
          </div>
        </div>
      </div>

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
