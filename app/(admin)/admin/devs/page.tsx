'use client'

import { useState, useEffect, useMemo, type FormEvent, type ReactNode } from 'react'
import {
  collection, query, where, onSnapshot,
  getDocs, getDoc, doc, updateDoc, deleteDoc, serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { createDevUser } from '@/lib/admin-auth'
import { PROJECT_STATUS_LABELS, type ProjectStatus } from '@/types'
import {
  Plus, Code2, X, Eye, EyeOff, Wifi, Loader2,
  Pencil, Trash2, Briefcase, CheckCircle2, Clock, AlertTriangle, Users,
} from 'lucide-react'

/* ─── UI types ────────────────────────────────────────────────────────────── */

type DevStatus = 'online' | 'ocupado' | 'offline'

type DevBase = {
  id: string
  name: string
  email: string
  specialty: string[]
  activeProjects: number
  completedProjects: number
  joinedAt: string
  avatar?: string
}

type PresenceData = {
  isOnline: boolean
  lastSeen: Timestamp | null
}

type Dev = DevBase & {
  status: DevStatus
  lastSeen: Date | null
}

type RichProject = {
  id: string
  product: string
  customer: string
  status: ProjectStatus
  date: string
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

const ACTIVE_STATUSES = new Set<ProjectStatus>(['paid', 'queued', 'assigned', 'in_progress', 'review'])
const STALE_MS = 5 * 60_000

const DEV_STATUS_STYLES: Record<DevStatus, string> = {
  online:  'text-green-400 bg-green-400/10 border-green-400/20',
  ocupado: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  offline: 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20',
}

const DEV_STATUS_LABELS: Record<DevStatus, string> = {
  online:  'Disponível',
  ocupado: 'Ocupado',
  offline: 'Offline',
}

const DOT_COLORS: Record<DevStatus, string> = {
  online:  'bg-green-400',
  ocupado: 'bg-yellow-400',
  offline: 'bg-neutral-600',
}

const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  pending_payment: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  paid:            'text-blue-400 bg-blue-400/10 border-blue-400/20',
  queued:          'text-neutral-400 bg-neutral-400/10 border-neutral-400/20',
  assigned:        'text-purple-400 bg-purple-400/10 border-purple-400/20',
  in_progress:     'text-blue-400 bg-blue-400/10 border-blue-400/20',
  review:          'text-orange-400 bg-orange-400/10 border-orange-400/20',
  delivered:       'text-brand bg-brand/10 border-brand/20',
  completed:       'text-green-400 bg-green-400/10 border-green-400/20',
}

const ALL_SPECIALTIES = [
  'Next.js', 'React', 'TypeScript', 'Node.js',
  'Tailwind', 'Firebase', 'Figma', 'CSS', 'UI/UX', 'Webflow',
]

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors'

/* ─── Mock data ───────────────────────────────────────────────────────────── */

const MOCK_DEVS: Dev[] = [
  {
    id: 'mock-1', name: 'Lucas Fernandes', email: 'lucas@crably.dev',
    specialty: ['Next.js', 'React', 'TypeScript', 'Tailwind'],
    activeProjects: 3, completedProjects: 14, joinedAt: '2024-01-15',
    status: 'ocupado', lastSeen: null,
    avatar: 'https://i.pravatar.cc/150?img=11',
  },
  {
    id: 'mock-2', name: 'Ana Paula Costa', email: 'ana@crably.dev',
    specialty: ['UI/UX', 'Figma', 'CSS', 'React'],
    activeProjects: 1, completedProjects: 22, joinedAt: '2023-08-10',
    status: 'online', lastSeen: null,
    avatar: 'https://i.pravatar.cc/150?img=47',
  },
  {
    id: 'mock-3', name: 'Rafael Oliveira', email: 'rafael@crably.dev',
    specialty: ['Node.js', 'Firebase', 'TypeScript'],
    activeProjects: 0, completedProjects: 7, joinedAt: '2024-03-20',
    status: 'offline', lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
    avatar: 'https://i.pravatar.cc/150?img=13',
  },
  {
    id: 'mock-4', name: 'Carla Mendes', email: 'carla@crably.dev',
    specialty: ['Webflow', 'CSS', 'Figma'],
    activeProjects: 2, completedProjects: 9, joinedAt: '2024-02-01',
    status: 'ocupado', lastSeen: null,
    avatar: 'https://i.pravatar.cc/150?img=44',
  },
  {
    id: 'mock-5', name: 'Bruno Almeida', email: 'bruno@crably.dev',
    specialty: ['React', 'Next.js', 'Node.js', 'Firebase', 'TypeScript'],
    activeProjects: 0, completedProjects: 31, joinedAt: '2023-05-12',
    status: 'online', lastSeen: null,
    avatar: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: 'mock-6', name: 'Fernanda Lima', email: 'fernanda@crably.dev',
    specialty: ['UI/UX', 'Figma', 'React'],
    activeProjects: 1, completedProjects: 18, joinedAt: '2023-11-08',
    status: 'online', lastSeen: null,
    avatar: 'https://i.pravatar.cc/150?img=49',
  },
  {
    id: 'mock-7', name: 'Diego Souza', email: 'diego@crably.dev',
    specialty: ['Tailwind', 'CSS', 'Next.js'],
    activeProjects: 2, completedProjects: 5, joinedAt: '2024-04-15',
    status: 'ocupado', lastSeen: null,
    avatar: 'https://i.pravatar.cc/150?img=8',
  },
  {
    id: 'mock-8', name: 'Mariana Rocha', email: 'mariana@crably.dev',
    specialty: ['TypeScript', 'React', 'Node.js'],
    activeProjects: 0, completedProjects: 12, joinedAt: '2024-01-28',
    status: 'offline', lastSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    avatar: 'https://i.pravatar.cc/150?img=56',
  },
  {
    id: 'mock-9', name: 'Pedro Nunes', email: 'pedro@crably.dev',
    specialty: ['Firebase', 'Node.js', 'TypeScript', 'React'],
    activeProjects: 4, completedProjects: 19, joinedAt: '2023-07-03',
    status: 'ocupado', lastSeen: null,
    avatar: 'https://i.pravatar.cc/150?img=15',
  },
  {
    id: 'mock-10', name: 'Isabela Torres', email: 'isabela@crably.dev',
    specialty: ['Next.js', 'Tailwind', 'UI/UX', 'Figma', 'CSS'],
    activeProjects: 0, completedProjects: 26, joinedAt: '2023-03-18',
    status: 'online', lastSeen: null,
    avatar: 'https://i.pravatar.cc/150?img=48',
  },
]

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function resolveStatus(isOnline: boolean, lastSeen: Date | null, activeProjects: number): DevStatus {
  if (!isOnline) return 'offline'
  if (lastSeen && Date.now() - lastSeen.getTime() > STALE_MS) return 'offline'
  return activeProjects > 0 ? 'ocupado' : 'online'
}

function formatLastSeen(d: Date | null): string {
  if (!d) return ''
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora mesmo'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  return d.toLocaleDateString('pt-BR')
}

/* ─── Shared primitives ───────────────────────────────────────────────────── */

function OnlineDot({ status }: { status: DevStatus }) {
  return (
    <span className="relative flex h-3 w-3 shrink-0">
      {status !== 'offline' && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${DOT_COLORS[status]}`} />
      )}
      <span className={`relative inline-flex rounded-full h-3 w-3 ${DOT_COLORS[status]}`} />
    </span>
  )
}

function DevAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
  const cls =
    size === 'lg' ? 'w-14 h-14 rounded-2xl text-lg' :
    size === 'sm' ? 'w-7 h-7 rounded-lg text-xs' :
                    'w-10 h-10 rounded-xl text-sm'
  return (
    <div className={`${cls} bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/25 flex items-center justify-center shrink-0`}>
      <span className="font-bold text-brand">{initials || '?'}</span>
    </div>
  )
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-400">
        {label} {required && <span className="text-brand">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

function PasswordInput({ value, onChange, show, onToggle, placeholder }: {
  value: string; onChange: (v: string) => void
  show: boolean; onToggle: () => void; placeholder: string
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className={`${inputCls} pr-10`}
      />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors">
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

function SpecialtiesField({ specialties, onToggle, customSkill, onCustomChange, onAddCustom }: {
  specialties: string[]; onToggle: (s: string) => void
  customSkill: string; onCustomChange: (v: string) => void; onAddCustom: () => void
}) {
  const custom = specialties.filter((s) => !ALL_SPECIALTIES.includes(s))
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-neutral-400">Especialidades</label>
      <div className="flex flex-wrap gap-2">
        {ALL_SPECIALTIES.map((s) => (
          <button key={s} type="button" onClick={() => onToggle(s)}
            className={['px-3 py-1 text-xs rounded-lg border transition-all',
              specialties.includes(s)
                ? 'bg-brand/10 text-brand border-brand/30'
                : 'bg-white/[0.03] text-neutral-500 border-white/8 hover:text-neutral-300 hover:border-white/15',
            ].join(' ')}>
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={customSkill} onChange={(e) => onCustomChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddCustom() } }}
          placeholder="Outra habilidade..."
          className={`${inputCls} flex-1 text-xs py-2`}
        />
        <button type="button" onClick={onAddCustom}
          className="px-3 py-2 text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">
          Adicionar
        </button>
      </div>
      {custom.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {custom.map((s) => (
            <span key={s} className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-brand/10 text-brand border border-brand/30">
              {s}
              <button type="button" onClick={() => onToggle(s)} className="hover:text-white transition-colors ml-0.5">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ModalShell({ title, subtitle, onClose, avatar, children }: {
  title: string; subtitle?: string; onClose: () => void; avatar?: ReactNode; children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {avatar}
            <div>
              <h2 className="text-base font-bold text-white">{title}</h2>
              {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalFooter({ onClose, loading, closeDisabled, submitLabel, loadingLabel }: {
  onClose: () => void; loading: boolean; closeDisabled?: boolean
  submitLabel: string; loadingLabel: string
}) {
  return (
    <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3 justify-end">
      <button type="button" onClick={onClose} disabled={closeDisabled ?? loading}
        className="px-4 py-2 text-sm text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-40">
        Cancelar
      </button>
      <button type="submit" disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-60">
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? loadingLabel : submitLabel}
      </button>
    </div>
  )
}

/* ─── Modals ──────────────────────────────────────────────────────────────── */

function CreateDevModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [name, setName]                       = useState('')
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword]       = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [passwordError, setPasswordError]     = useState('')
  const [firebaseError, setFirebaseError]     = useState('')
  const [loading, setLoading]                 = useState(false)
  const [specialties, setSpecialties]         = useState<string[]>([])
  const [customSkill, setCustomSkill]         = useState('')

  function toggleSpecialty(s: string) {
    setSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }
  function addCustomSkill() {
    const t = customSkill.trim()
    if (t && !specialties.includes(t)) setSpecialties((prev) => [...prev, t])
    setCustomSkill('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setFirebaseError('')
    if (password.length < 6)         { setPasswordError('Mínimo 6 caracteres.'); return }
    if (password !== confirmPassword) { setPasswordError('As senhas não coincidem.'); return }
    setLoading(true)
    const result = await createDevUser({ email: email.trim(), password, name: name.trim(), specialty: specialties })
    setLoading(false)
    if (!result.success) { setFirebaseError(result.error); return }
    onSuccess()
  }

  return (
    <ModalShell title="Cadastrar dev" subtitle="Cria um acesso na plataforma." onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <Field label="Nome completo" required>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva" required className={inputCls} />
          </Field>
          <Field label="Email" required>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dev@crably.dev" required className={inputCls} />
          </Field>
          <Field label="Senha" required>
            <PasswordInput value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword(p => !p)} placeholder="Mínimo 6 caracteres" />
          </Field>
          <Field label="Confirmar senha" required error={passwordError}>
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(p => !p)} placeholder="Repita a senha" />
          </Field>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <Wifi size={14} className="text-neutral-500 mt-0.5 shrink-0" />
            <p className="text-xs text-neutral-500 leading-relaxed">
              Presença detectada automaticamente — <span className="text-green-400">disponível</span> quando online sem projetos, <span className="text-yellow-400">ocupado</span> com projetos ativos.
            </p>
          </div>
          <SpecialtiesField specialties={specialties} onToggle={toggleSpecialty} customSkill={customSkill} onCustomChange={setCustomSkill} onAddCustom={addCustomSkill} />
        </div>
        {firebaseError && <p className="px-6 py-3 text-xs text-red-400 bg-red-400/5 border-t border-red-400/10">{firebaseError}</p>}
        <ModalFooter onClose={onClose} loading={loading} closeDisabled={loading} submitLabel="Cadastrar" loadingLabel="Cadastrando..." />
      </form>
    </ModalShell>
  )
}

function EditDevModal({ dev, onSuccess, onClose }: { dev: Dev; onSuccess: () => void; onClose: () => void }) {
  const [name, setName]               = useState(dev.name)
  const [specialties, setSpecialties] = useState<string[]>(dev.specialty)
  const [customSkill, setCustomSkill] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  function toggleSpecialty(s: string) {
    setSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }
  function addCustomSkill() {
    const t = customSkill.trim()
    if (t && !specialties.includes(t)) setSpecialties((prev) => [...prev, t])
    setCustomSkill('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      await updateDoc(doc(db, 'users', dev.id), { name: name.trim(), specialty: specialties, updatedAt: serverTimestamp() })
      onSuccess()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <ModalShell title="Editar dev" subtitle={dev.email} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <DevAvatar name={name || dev.name} />
            <div>
              <p className="text-sm font-medium text-white">{name || dev.name}</p>
              <p className="text-xs text-neutral-500">{dev.email}</p>
            </div>
          </div>
          <Field label="Nome completo" required>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
          </Field>
          <SpecialtiesField specialties={specialties} onToggle={toggleSpecialty} customSkill={customSkill} onCustomChange={setCustomSkill} onAddCustom={addCustomSkill} />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <ModalFooter onClose={onClose} loading={loading} submitLabel="Salvar" loadingLabel="Salvando..." />
      </form>
    </ModalShell>
  )
}

function DeleteDevModal({ dev, onSuccess, onClose }: { dev: Dev; onSuccess: () => void; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleConfirm() {
    setLoading(true)
    try {
      await deleteDoc(doc(db, 'users', dev.id))
      onSuccess()
    } catch {
      setError('Erro ao excluir.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        <div className="px-6 pt-7 pb-5 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center justify-center">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Excluir dev?</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              O cadastro de <span className="text-white font-medium">{dev.name}</span> será removido permanentemente.
            </p>
            <p className="text-xs text-neutral-600 mt-1">A conta de autenticação deve ser removida manualmente no Firebase.</p>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 text-sm text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-40">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectRow({ project }: { project: RichProject }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{project.product}</p>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">{project.customer}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-neutral-600 hidden sm:block">{project.date}</span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${PROJECT_STATUS_COLORS[project.status]}`}>
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
      </div>
    </div>
  )
}

function ProjectsModal({ dev, onClose }: { dev: Dev; onClose: () => void }) {
  const [projects, setProjects] = useState<RichProject[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    async function load() {
      try {
        if (dev.id.startsWith('mock-')) { setLoading(false); return }
        const ordersSnap = await getDocs(query(collection(db, 'orders'), where('assignedDevId', '==', dev.id)))
        if (ordersSnap.empty) { setLoading(false); return }
        const orders = ordersSnap.docs.map((d) => ({
          id: d.id, productId: d.data().productId as string,
          userId: d.data().userId as string,
          projectStatus: d.data().projectStatus as ProjectStatus,
          createdAt: d.data().createdAt as Timestamp | null,
        }))
        const productIds  = [...new Set(orders.map((o) => o.productId))]
        const customerIds = [...new Set(orders.map((o) => o.userId))]
        const [productDocs, customerDocs] = await Promise.all([
          Promise.all(productIds.map((id)  => getDoc(doc(db, 'products', id)))),
          Promise.all(customerIds.map((id) => getDoc(doc(db, 'users', id)))),
        ])
        const productMap  = Object.fromEntries(productDocs.map((d) => [d.id, d.data()?.name ?? d.id]))
        const customerMap = Object.fromEntries(customerDocs.map((d) => [d.id, d.data()?.name ?? d.data()?.email ?? d.id]))
        setProjects(orders.map((o) => ({
          id: o.id, product: productMap[o.productId] ?? o.productId,
          customer: customerMap[o.userId] ?? o.userId, status: o.projectStatus,
          date: o.createdAt?.toDate().toISOString().slice(0, 10) ?? '—',
        })))
      } catch { setError('Erro ao carregar projetos.') }
      finally { setLoading(false) }
    }
    load()
  }, [dev.id])

  const active   = projects.filter((p) => ACTIVE_STATUSES.has(p.status))
  const finished = projects.filter((p) => !ACTIVE_STATUSES.has(p.status))

  return (
    <ModalShell
      title={`Projetos — ${dev.name}`}
      subtitle={`${projects.length} projeto${projects.length !== 1 ? 's' : ''} atribuído${projects.length !== 1 ? 's' : ''}`}
      onClose={onClose}
      avatar={<DevAvatar name={dev.name} size="sm" />}
    >
      <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-neutral-500" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-400 text-center py-8">{error}</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-10">
            <Briefcase size={32} className="text-neutral-700 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">Nenhum projeto atribuído.</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={13} className="text-brand" />
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Em andamento</span>
                </div>
                <div className="space-y-2">{active.map((p) => <ProjectRow key={p.id} project={p} />)}</div>
              </div>
            )}
            {finished.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={13} className="text-green-400" />
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Concluídos</span>
                </div>
                <div className="space-y-2">{finished.map((p) => <ProjectRow key={p.id} project={p} />)}</div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
          Fechar
        </button>
      </div>
    </ModalShell>
  )
}

/* ─── Dev card ────────────────────────────────────────────────────────────── */

function DevCard({ dev, onEdit, onDelete, onViewProjects }: {
  dev: Dev
  onEdit: (d: Dev) => void
  onDelete: (d: Dev) => void
  onViewProjects: (d: Dev) => void
}) {
  const statusLine =
    dev.status === 'online'  ? 'bg-green-400' :
    dev.status === 'ocupado' ? 'bg-yellow-400' : 'bg-neutral-700'

  const initials = dev.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()

  return (
    <div className="relative rounded-2xl bg-[#111111] border border-white/[0.06] hover:border-white/[0.11] transition-all overflow-hidden flex flex-col items-center text-center px-5 pt-6 pb-4 gap-3">

      {/* Status strip at top */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b-full ${statusLine}`} />

      {/* Avatar — circle */}
      <div className="w-16 h-16 rounded-full border-2 border-white/[0.08] overflow-hidden flex items-center justify-center shrink-0 bg-gradient-to-br from-brand/20 to-brand/5">
        {dev.avatar
          ? <img src={dev.avatar} alt={dev.name} className="w-full h-full object-cover" />
          : <span className="text-lg font-bold text-brand">{initials}</span>
        }
      </div>

      {/* Name + email */}
      <div>
        <p className="text-sm font-semibold text-white leading-none">{dev.name}</p>
        <p className="text-[11px] text-neutral-600 mt-1 truncate max-w-[160px]">{dev.email}</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5">
        <OnlineDot status={dev.status} />
        <span className="text-[11px] text-neutral-500">{DEV_STATUS_LABELS[dev.status]}</span>
      </div>

      {/* Skills — plain dot-separated text */}
      {dev.specialty.length > 0 && (
        <p className="text-[11px] text-neutral-700 leading-relaxed">
          {dev.specialty.slice(0, 3).join(' · ')}
          {dev.specialty.length > 3 && (
            <span className="text-neutral-800"> +{dev.specialty.length - 3}</span>
          )}
        </p>
      )}

      {/* Stats */}
      <div className="w-full grid grid-cols-2 gap-2 mt-1">
        <div className="rounded-xl bg-white/[0.03] py-2.5">
          <p className="text-base font-bold text-white leading-none">{dev.activeProjects}</p>
          <p className="text-[10px] text-neutral-700 mt-1">ativos</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] py-2.5">
          <p className="text-base font-bold text-white leading-none">{dev.completedProjects}</p>
          <p className="text-[10px] text-neutral-700 mt-1">entregues</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1">
        <button onClick={() => onViewProjects(dev)} title="Ver projetos"
          className="p-1.5 rounded-lg text-neutral-700 hover:text-brand hover:bg-brand/8 transition-all">
          <Briefcase size={13} />
        </button>
        <button onClick={() => onEdit(dev)} title="Editar"
          className="p-1.5 rounded-lg text-neutral-700 hover:text-white hover:bg-white/8 transition-all">
          <Pencil size={13} />
        </button>
        <button onClick={() => onDelete(dev)} title="Excluir"
          className="p-1.5 rounded-lg text-neutral-700 hover:text-red-400 hover:bg-red-400/8 transition-all">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

type FilterTab = 'todos' | DevStatus

export default function DevsPage() {
  const [devBase, setDevBase]               = useState<Map<string, DevBase>>(new Map())
  const [presence, setPresence]             = useState<Map<string, PresenceData>>(new Map())
  const [pageLoading, setPageLoading]       = useState(true)
  const [pageError, setPageError]           = useState('')
  const [creating, setCreating]             = useState(false)
  const [editing, setEditing]               = useState<Dev | null>(null)
  const [deleting, setDeleting]             = useState<Dev | null>(null)
  const [viewingProjects, setViewingProjects] = useState<Dev | null>(null)
  const [filter, setFilter]                 = useState<FilterTab>('todos')

  useEffect(() => {
    const devsQ = query(collection(db, 'users'), where('role', '==', 'developer'))
    const unsub = onSnapshot(devsQ, async (snap) => {
      try {
        const ordersSnap = await getDocs(collection(db, 'orders'))
        const allOrders = ordersSnap.docs.map((d) => ({
          assignedDevId: (d.data().assignedDevId ?? '') as string,
          projectStatus: d.data().projectStatus as ProjectStatus,
        }))
        const map = new Map<string, DevBase>()
        snap.docs.forEach((d) => {
          const data = d.data()
          const mine = allOrders.filter((o) => o.assignedDevId === d.id)
          map.set(d.id, {
            id: d.id, name: data.name ?? '', email: data.email ?? '',
            specialty: data.specialty ?? [],
            activeProjects: mine.filter((o) => ACTIVE_STATUSES.has(o.projectStatus)).length,
            completedProjects: mine.filter((o) => o.projectStatus === 'completed' || o.projectStatus === 'delivered').length,
            joinedAt: data.createdAt?.toDate().toISOString().slice(0, 10) ?? '—',
          })
        })
        setDevBase(map)
      } catch { setPageError('Erro ao calcular estatísticas.') }
      finally { setPageLoading(false) }
    }, () => { setPageError('Erro ao carregar.'); setPageLoading(false) })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'presence'), (snap) => {
      const map = new Map<string, PresenceData>()
      snap.docs.forEach((d) => {
        map.set(d.id, { isOnline: d.data().isOnline ?? false, lastSeen: d.data().lastSeen ?? null })
      })
      setPresence(map)
    })
    return unsub
  }, [])

  const realDevs: Dev[] = useMemo(() => {
    return Array.from(devBase.values()).map((base) => {
      const p = presence.get(base.id)
      const lastSeen = p?.lastSeen?.toDate() ?? null
      return { ...base, status: resolveStatus(p?.isOnline ?? false, lastSeen, base.activeProjects), lastSeen }
    })
  }, [devBase, presence])

  const isDemo = !pageLoading && realDevs.length === 0
  const devs   = isDemo ? MOCK_DEVS : realDevs

  const filtered = filter === 'todos' ? devs : devs.filter((d) => d.status === filter)

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'todos',   label: 'Todos',      count: devs.length },
    { key: 'online',  label: 'Disponível', count: devs.filter(d => d.status === 'online').length },
    { key: 'ocupado', label: 'Ocupado',    count: devs.filter(d => d.status === 'ocupado').length },
    { key: 'offline', label: 'Offline',    count: devs.filter(d => d.status === 'offline').length },
  ]

  return (
    <>
      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium text-neutral-600 uppercase tracking-widest">Equipe</p>
            <h1 className="text-2xl font-bold text-white mt-1">
              Desenvolvedores
              {!pageLoading && (
                <span className="ml-2.5 text-base font-normal text-neutral-600">{devs.length}</span>
              )}
            </h1>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
          >
            <Plus size={15} /> Cadastrar dev
          </button>
        </div>

        {/* ── Filter tabs ────────────────────────────────────────── */}
        {!pageLoading && devs.length > 0 && (
          <div className="flex items-center gap-1.5">
            {filterTabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  filter === key
                    ? 'bg-brand/10 text-brand border-brand/20'
                    : 'text-neutral-600 border-transparent hover:text-neutral-300',
                ].join(' ')}
              >
                {key !== 'todos' && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    key === 'online' ? 'bg-green-400' :
                    key === 'ocupado' ? 'bg-yellow-400' : 'bg-neutral-600'
                  }`} />
                )}
                {label}
                <span className="text-neutral-700">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Content ────────────────────────────────────────────── */}
        {pageLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-neutral-700" />
          </div>
        ) : pageError ? (
          <div className="text-center py-16">
            <p className="text-sm text-red-400">{pageError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-[#111111] border border-white/[0.06] p-12 text-center">
            <Code2 size={32} className="text-neutral-700 mx-auto mb-4" />
            <p className="text-sm font-medium text-neutral-400">
              {filter === 'todos' ? 'Nenhum dev cadastrado ainda.' : `Nenhum dev ${DEV_STATUS_LABELS[filter as DevStatus].toLowerCase()}.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filtered.map((dev) => (
              <DevCard
                key={dev.id}
                dev={dev}
                onEdit={setEditing}
                onDelete={setDeleting}
                onViewProjects={setViewingProjects}
              />
            ))}
          </div>
        )}
      </div>

      {creating        && <CreateDevModal  onSuccess={() => setCreating(false)}    onClose={() => setCreating(false)} />}
      {editing         && <EditDevModal    dev={editing}        onSuccess={() => setEditing(null)}        onClose={() => setEditing(null)} />}
      {deleting        && <DeleteDevModal  dev={deleting}       onSuccess={() => setDeleting(null)}       onClose={() => setDeleting(null)} />}
      {viewingProjects && <ProjectsModal   dev={viewingProjects}                   onClose={() => setViewingProjects(null)} />}
    </>
  )
}
