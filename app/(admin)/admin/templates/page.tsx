'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Plus, ExternalLink, Pencil, Trash2,
  X, Loader2, Link2, ImageIcon, Globe,
  Eye, Minus, AlertCircle, Upload,
} from 'lucide-react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'

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

// ─── image upload ─────────────────────────────────────────────────────────────

type ImageEntry =
  | { kind: 'existing'; url: string }
  | { kind: 'pending'; file: File; localUrl: string }
  | { kind: 'empty' }

function ImageSlot({
  entry,
  onFileSelect,
  onRemove,
  canRemove,
}: {
  entry: ImageEntry
  onFileSelect: (file: File) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const preview =
    entry.kind === 'existing' ? entry.url
    : entry.kind === 'pending' ? entry.localUrl
    : null

  return (
    <div className="relative group">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileSelect(file)
          e.target.value = ''
        }}
      />

      {preview ? (
        <div className="relative h-28 rounded-xl overflow-hidden border border-white/8 bg-white/[0.02]">
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              title="Trocar imagem"
              className="p-2 rounded-lg bg-black/70 text-white hover:bg-black/90 transition-colors"
            >
              <Upload size={13} />
            </button>
            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                title="Remover"
                className="p-2 rounded-lg bg-black/70 text-red-400 hover:bg-black/90 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
          {entry.kind === 'pending' && (
            <span className="absolute bottom-2 left-2 text-[10px] bg-brand/80 text-white px-1.5 py-0.5 rounded-md font-medium">
              novo
            </span>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-28 rounded-xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.04] hover:border-brand/30 transition-all flex flex-col items-center justify-center gap-2 text-neutral-600 hover:text-neutral-400"
        >
          <Upload size={18} />
          <span className="text-xs">Upload</span>
        </button>
      )}
    </div>
  )
}

async function uploadImages(slug: string, entries: ImageEntry[]): Promise<string[]> {
  const urls: string[] = []
  for (const entry of entries) {
    if (entry.kind === 'existing') {
      urls.push(entry.url)
    } else if (entry.kind === 'pending') {
      const ext = entry.file.name.split('.').pop() ?? 'jpg'
      const path = `products/${slug}/${crypto.randomUUID()}.${ext}`
      const snap = await uploadBytes(storageRef(storage, path), entry.file)
      urls.push(await getDownloadURL(snap.ref))
    }
  }
  return urls
}

// ─── modal ───────────────────────────────────────────────────────────────────

function ProductModal({
  onClose,
  onCreated,
  onUpdated,
  product,
}: {
  onClose: () => void
  onCreated?: (p: ProductWithStats) => void
  onUpdated?: (p: ProductWithStats) => void
  product?: ProductWithStats
}) {
  const isEdit = !!product
  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(isEdit)
  const [price, setPrice] = useState<number | null>(product?.price ?? null)
  const [description, setDescription] = useState(product?.description ?? '')
  const [images, setImages] = useState<ImageEntry[]>(
    product?.images?.length
      ? product.images.map((url) => ({ kind: 'existing' as const, url }))
      : [{ kind: 'empty' as const }]
  )
  const [refs, setRefs] = useState<Reference[]>(
    product?.references?.length ? product.references : [{ title: '', url: '' }],
  )
  const [previewUrl, setPreviewUrl] = useState('')
  const [iframeError, setIframeError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleNameChange(v: string) {
    setName(v)
    if (!slugEdited) setSlug(toSlug(v))
  }

  // images
  const addImage = () => setImages((p) => [...p, { kind: 'empty' as const }])
  const setImageFile = (i: number, file: File) => {
    const localUrl = URL.createObjectURL(file)
    setImages((p) => p.map((e, j) => j === i ? { kind: 'pending' as const, file, localUrl } : e))
  }
  const removeImage = (i: number) => setImages((p) => p.filter((_, j) => j !== i))

  // refs
  const addRef = () => setRefs((p) => [...p, { title: '', url: '' }])
  const updateRef = (i: number, field: keyof Reference, v: string) =>
    setRefs((p) => p.map((r, j) => (j === i ? { ...r, [field]: v } : r)))
  const removeRef = (i: number) => setRefs((p) => p.filter((_, j) => j !== i))

  function triggerPreview(url: string) {
    if (!url.trim()) return
    setIframeError(false)
    const normalized = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`
    setPreviewUrl(normalized)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome obrigatório.'
    if (!slug.trim()) e.slug = 'Slug obrigatório.'
    if (price === null || price <= 0) e.price = 'Informe um preço válido.'
    if (!description.trim()) e.description = 'Descrição obrigatória.'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const currentSlug = slug.trim()
      const uploadedImages = await uploadImages(currentSlug, images)
      const data = {
        name: name.trim(),
        slug: currentSlug,
        price: price!,
        description: description.trim(),
        images: uploadedImages,
        references: refs
          .filter((r) => r.url.trim())
          .map((r) => ({ title: r.title.trim(), url: r.url.trim() })),
      }
      if (isEdit && product) {
        await updateDoc(doc(db, 'products', product.id), data)
        onUpdated?.({ id: product.id, ...data, sales: product.sales })
      } else {
        const ref = await addDoc(collection(db, 'products'), data)
        onCreated?.({ id: ref.id, ...data, sales: 0 })
      }
    } catch {
      setErrors({ submit: `Erro ao ${isEdit ? 'salvar' : 'criar'} o site. Tente novamente.` })
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
            <h2 className="text-base font-bold text-white">{isEdit ? 'Editar site' : 'Novo site'}</h2>
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
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={price === null ? '' : (price / 100).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '')
                      setPrice(digits ? parseInt(digits, 10) : null)
                    }}
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
                Imagens exibidas na página do produto. Fazem upload direto para o Firebase Storage.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {images.map((entry, i) => (
                  <ImageSlot
                    key={i}
                    entry={entry}
                    onFileSelect={(file) => setImageFile(i, file)}
                    onRemove={() => removeImage(i)}
                    canRemove={images.length > 1}
                  />
                ))}
              </div>

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
              {loading
                ? (images.some((e) => e.kind === 'pending') ? 'Enviando imagens...' : (isEdit ? 'Salvando...' : 'Criando...'))
                : (isEdit ? 'Salvar alterações' : 'Criar site')}
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
  const [editProduct, setEditProduct] = useState<ProductWithStats | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductWithStats | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  function handleUpdated(product: ProductWithStats) {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)))
    setEditProduct(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'products', deleteTarget.id))
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
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
        <ProductModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {editProduct && (
        <ProductModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onUpdated={handleUpdated}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm bg-[#0e0e0e] border border-white/8 rounded-2xl shadow-2xl p-6 space-y-5 animate-fade-up">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-400/10 border border-red-400/10 flex items-center justify-center shrink-0">
                <Trash2 size={16} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Remover site</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Tem certeza que deseja remover{' '}
                  <span className="text-neutral-300 font-medium">{deleteTarget.name}</span>?
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                {deleting ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
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
              <div className="aspect-[4/3] rounded-xl bg-[#0d0d0d] border border-white/5 relative overflow-hidden">
                {product.images?.[0] ? (
                  <>
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#111111] to-transparent pointer-events-none" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-neutral-600 text-xs font-medium">Sem imagem</span>
                    </div>
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
                <button
                  onClick={() => setEditProduct(product)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 text-xs text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Pencil size={13} />
                  Editar
                </button>
                <button
                  onClick={() => setDeleteTarget(product)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-colors"
                >
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
