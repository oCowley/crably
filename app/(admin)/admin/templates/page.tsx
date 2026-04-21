'use client'

import { useEffect, useState } from 'react'
import {
  Plus, ExternalLink, Pencil, Trash2,
  X, Loader2, Link2, ImageIcon, Globe,
  Eye, Minus, AlertCircle,
} from 'lucide-react'
import { collection, getDocs, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// ─── types ───────────────────────────────────────────────────────────────────

interface Reference {
  title: string
  url: string
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  description: string
  images: string[]
  references: Reference[]
}

interface ProductWithStats extends Product {
  sales: number
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function toSlug(v: string) {
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const inputCls =
  'w-full px-3 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors'

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-white/5">
      <Icon size={13} className="text-brand shrink-0" />
      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
        {label}
      </span>
    </div>
  )
}

// ─── modal ───────────────────────────────────────────────────────────────────

function CreateProductModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (p: ProductWithStats) => void
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([''])
  const [refs, setRefs] = useState<Reference[]>([{ title: '', url: '' }])
  const [previewUrl, setPreviewUrl] = useState('')
  const [iframeError, setIframeError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleNameChange(v: string) {
    setName(v)
    if (!slugEdited) setSlug(toSlug(v))
  }

  // images
  const addImage = () => setImages((p) => [...p, ''])
  const updateImage = (i: number, v: string) =>
    setImages((p) => p.map((u, j) => (j === i ? v : u)))
  const removeImage = (i: number) => setImages((p) => p.filter((_, j) => j !== i))

  // refs
  const addRef = () => setRefs((p) => [...p, { title: '', url: '' }])
  const updateRef = (i: number, field: keyof Reference, v: string) =>
    setRefs((p) => p.map((r, j) => (j === i ? { ...r, [field]: v } : r)))
  const removeRef = (i: number) => setRefs((p) => p.filter((_, j) => j !== i))

  function triggerPreview(url: string) {
    if (!url.trim()) return
    setIframeError(false)
    setPreviewUrl(url.trim())
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome obrigatório.'
    if (!slug.trim()) e.slug = 'Slug obrigatório.'
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0)
      e.price = 'Informe um preço válido.'
    if (!description.trim()) e.description = 'Descrição obrigatória.'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const data = {
        name: name.trim(),
        slug: slug.trim(),
        price: Math.round(Number(price) * 100),
        description: description.trim(),
        images: images.filter((u) => u.trim()),
        references: refs
          .filter((r) => r.url.trim())
          .map((r) => ({ title: r.title.trim(), url: r.url.trim() })),
      }
      const ref = await addDoc(collection(db, 'products'), data)
      onCreated({ id: ref.id, ...data, sales: 0 })
    } catch {
      setErrors({ submit: 'Erro ao criar o site. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-5xl bg-[#0e0e0e] border border-white/8 rounded-2xl shadow-2xl overflow-hidden animate-fade-up flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* ── header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Novo site</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Preencha os dados e adicione referências para preview do cliente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* left — form */}
          <form
            id="create-form"
            onSubmit={handleSubmit}
            className="w-[420px] shrink-0 overflow-y-auto p-6 space-y-7 border-r border-white/5"
          >
            {/* basic info */}
            <div className="space-y-4">
              <SectionHeader icon={Globe} label="Informações básicas" />

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">Nome</label>
                <input
                  className={inputCls}
                  placeholder="Ex: Agency Pro"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">Slug</label>
                <input
                  className={inputCls}
                  placeholder="agency-pro"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
                />
                <p className="text-[11px] text-neutral-600">
                  /products/<span className="text-neutral-400">{slug || '...'}</span>
                </p>
                {errors.slug && <p className="text-xs text-red-400">{errors.slug}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">Preço (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 pointer-events-none">
                    R$
                  </span>
                  <input
                    className={`${inputCls} pl-9`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1997.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                {errors.price && <p className="text-xs text-red-400">{errors.price}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">Descrição</label>
                <textarea
                  className={`${inputCls} resize-none h-24`}
                  placeholder="Descreva o que está incluído neste site..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
              </div>
            </div>

            {/* images */}
            <div className="space-y-3">
              <SectionHeader icon={ImageIcon} label="Imagens" />
              <p className="text-[11px] text-neutral-600 -mt-1">
                URLs das imagens exibidas na página do produto.
              </p>

              {images.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  {url && (
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-white/5 border border-white/8">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input
                    className={`${inputCls} flex-1`}
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => updateImage(i, e.target.value)}
                  />
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="p-1.5 text-neutral-600 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Minus size={14} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addImage}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-brand transition-colors"
              >
                <Plus size={13} />
                Adicionar imagem
              </button>
            </div>

            {/* references */}
            <div className="space-y-3">
              <SectionHeader icon={Link2} label="Referências de preview" />
              <p className="text-[11px] text-neutral-600 -mt-1">
                Links que o cliente poderá visualizar como prévia dentro do site.
              </p>

              {refs.map((r, i) => (
                <div key={i} className="space-y-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <input
                    className={inputCls}
                    placeholder="Título (ex: Versão desktop)"
                    value={r.title}
                    onChange={(e) => updateRef(i, 'title', e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      className={`${inputCls} flex-1`}
                      placeholder="https://..."
                      value={r.url}
                      onChange={(e) => updateRef(i, 'url', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => triggerPreview(r.url)}
                      disabled={!r.url.trim()}
                      title="Visualizar"
                      className="p-2 rounded-lg text-neutral-500 hover:text-brand hover:bg-brand/10 disabled:opacity-30 transition-colors shrink-0"
                    >
                      <Eye size={15} />
                    </button>
                    {refs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRef(i)}
                        className="p-2 text-neutral-600 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Minus size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addRef}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-brand transition-colors"
              >
                <Plus size={13} />
                Adicionar referência
              </button>
            </div>

            {errors.submit && (
              <p className="text-xs text-red-400 bg-red-400/5 border border-red-400/10 rounded-xl px-3 py-2.5">
                {errors.submit}
              </p>
            )}
          </form>

          {/* right — preview panel */}
          <div className="flex-1 flex flex-col bg-[#080808] min-w-0">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
              <span className="text-xs font-medium text-neutral-500">
                {previewUrl ? 'Preview' : 'Preview — aguardando URL'}
              </span>
              {previewUrl && !iframeError && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-white transition-colors"
                >
                  <ExternalLink size={11} />
                  Abrir em nova aba
                </a>
              )}
            </div>

            <div className="flex-1 relative overflow-hidden">
              {!previewUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                    <Eye size={20} className="text-neutral-700" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 font-medium">Nenhuma prévia ativa</p>
                    <p className="text-xs text-neutral-600 mt-1">
                      Adicione uma referência, insira a URL e clique em{' '}
                      <Eye size={11} className="inline-block align-middle" /> para visualizar aqui.
                    </p>
                  </div>
                </div>
              )}

              {previewUrl && iframeError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-10">
                  <div className="w-12 h-12 rounded-2xl bg-red-400/10 border border-red-400/10 flex items-center justify-center">
                    <AlertCircle size={20} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400 font-medium">Preview bloqueado</p>
                    <p className="text-xs text-neutral-600 mt-1">
                      Este site não permite incorporação via iframe.
                    </p>
                  </div>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline"
                  >
                    <ExternalLink size={12} />
                    Abrir em nova aba
                  </a>
                </div>
              )}

              {previewUrl && !iframeError && (
                <div className="absolute inset-0 overflow-hidden">
                  {/* scale trick: renders 200% and shrinks to 50% so iframe sees 2× the viewport */}
                  <div
                    className="absolute top-0 left-0 origin-top-left"
                    style={{ width: '200%', height: '200%', transform: 'scale(0.5)' }}
                  >
                    <iframe
                      key={previewUrl}
                      src={previewUrl}
                      className="w-full h-full border-0"
                      title="Preview"
                      onError={() => setIframeError(true)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── footer ── */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between shrink-0">
          <p className="text-xs text-neutral-600">
            As referências ficam disponíveis para o cliente na página do produto.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="create-form"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Criando...' : 'Criar site'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [products, setProducts] = useState<ProductWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsSnap, ordersSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'orders')),
        ])

        const salesMap: Record<string, number> = {}
        ordersSnap.forEach((doc) => {
          const { productId } = doc.data()
          if (productId) salesMap[productId] = (salesMap[productId] ?? 0) + 1
        })

        const list: ProductWithStats[] = productsSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Product, 'id'>),
          sales: salesMap[doc.id] ?? 0,
        }))

        setProducts(list)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  function handleCreated(product: ProductWithStats) {
    setProducts((prev) => [product, ...prev])
    setShowCreate(false)
  }

  const totalVendas = products.reduce((s, p) => s + p.sales, 0)
  const semVendas = products.filter((p) => p.sales === 0).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500 text-sm">Carregando sites...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {showCreate && (
        <CreateProductModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Sites</h1>
          <p className="text-neutral-500 text-sm">Gerencie os sites disponíveis na loja.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
        >
          <Plus size={16} />
          Novo site
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Sites cadastrados', value: products.length, color: 'text-green-400' },
          { label: 'Total de vendas', value: totalVendas, color: 'text-brand' },
          { label: 'Sem vendas', value: semVendas, color: 'text-neutral-400' },
        ].map((s) => (
          <div key={s.label} className="bento-card p-5">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="bento-card p-12 flex flex-col items-center justify-center text-center">
          <p className="text-neutral-400 text-sm">Nenhum site cadastrado ainda.</p>
          <p className="text-neutral-600 text-xs mt-1">Clique em "Novo site" para adicionar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bento-card p-5 flex flex-col gap-4">
              {/* Preview */}
              <div className="h-36 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 flex items-center justify-center relative overflow-hidden">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent" />
                    <span className="text-neutral-600 text-xs font-medium relative z-10">Preview</span>
                  </>
                )}
                <a
                  href={`/products/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-neutral-400 hover:text-white transition-colors z-10"
                  title="Ver produto"
                >
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Info */}
              <div className="min-w-0">
                <h3 className="font-semibold text-white text-sm truncate">{product.name}</h3>
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{product.description}</p>
              </div>

              {product.references?.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Link2 size={11} className="text-neutral-600 shrink-0" />
                  <span className="text-xs text-neutral-600">
                    {product.references.length}{' '}
                    {product.references.length === 1 ? 'referência' : 'referências'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span className="font-semibold text-white text-sm">
                  {(product.price / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
                <span>
                  {product.sales} {product.sales === 1 ? 'venda' : 'vendas'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                <button className="flex-1 inline-flex items-center justify-center gap-2 py-2 text-xs text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <Pencil size={13} />
                  Editar
                </button>
                <button className="flex-1 inline-flex items-center justify-center gap-2 py-2 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-colors">
                  <Trash2 size={13} />
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
