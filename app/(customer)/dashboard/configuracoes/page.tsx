'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Camera } from 'lucide-react'
import { db, auth } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { maskDocument, maskPhone } from '@/lib/masks'

interface FormData {
  cpf: string
  phone: string
  birthDate: string
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">
      {children}
      {required && <span className="ml-1 text-brand normal-case tracking-normal">*</span>}
    </label>
  )
}

const inputBase =
  'w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-brand/50 transition-colors'

const inputDisabled =
  'w-full h-9 px-3 rounded-lg bg-white/[0.02] border border-white/5 text-neutral-600 text-sm cursor-not-allowed select-none'

export default function ConfiguracoesPage() {
  const { user, profile, logout } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState<FormData>({ cpf: '', phone: '', birthDate: '' })
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [passwordSent, setPasswordSent] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const uid = user?.uid

  useEffect(() => {
    if (!uid) return

    async function loadProfile() {
      try {
        const snap = await getDoc(doc(db, 'users', uid as string))
        if (snap.exists()) {
          const data = snap.data()
          setForm({
            cpf: maskDocument((data.cpf as string) || ''),
            phone: maskPhone((data.phone as string) || ''),
            birthDate: (data.birthDate as string) || '',
          })
        }
      } finally {
        setLoadingData(false)
      }
    }

    loadProfile()
  }, [uid])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          name: profile?.name ?? '',
          email: user.email,
          // Remove máscara antes de persistir
          cpf: form.cpf.replace(/\D/g, ''),
          phone: form.phone.replace(/\D/g, ''),
          birthDate: form.birthDate,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordReset() {
    if (!user?.email) return
    await sendPasswordResetEmail(auth, user.email)
    setPasswordSent(true)
    setTimeout(() => setPasswordSent(false), 5000)
  }

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  if (loadingData) {
    return (
      <div className="max-w-3xl">
        <div className="h-7 w-36 bg-white/5 rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-64 bg-[#111111] rounded-2xl border border-white/5 animate-pulse" />
          <div className="space-y-4">
            <div className="h-28 bg-[#111111] rounded-2xl border border-white/5 animate-pulse" />
            <div className="h-24 bg-[#111111] rounded-2xl border border-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-neutral-400 mt-1 text-sm">
          Gerencie seus dados e preferências
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Dados pessoais */}
        <section className="lg:col-span-2 p-5 bg-[#111111] rounded-2xl border border-white/5">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">
            Dados pessoais
          </h2>

          {/* Foto de perfil — placeholder para implementação futura */}
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/5">
            <div className="relative group">
              <div className="w-16 h-16 rounded-full bg-brand/10 border-2 border-dashed border-brand/30 flex items-center justify-center shrink-0">
                {user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-brand/60">{initials}</span>
                )}
              </div>
              {/* Overlay de câmera */}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-not-allowed">
                <Camera size={16} className="text-white/60" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{profile?.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{user?.email}</p>
              <p className="text-xs text-neutral-700 mt-1.5 flex items-center gap-1">
                <Camera size={11} />
                Upload de foto — em breve
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            {/* Nome + Email — bloqueados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Nome</Label>
                <input
                  disabled
                  value={profile?.name ?? ''}
                  title="O nome é definido no cadastro"
                  className={inputDisabled}
                />
              </div>
              <div>
                <Label>Email</Label>
                <input
                  disabled
                  value={user?.email ?? ''}
                  title="O email não pode ser alterado"
                  className={inputDisabled}
                />
              </div>
            </div>

            {/* CPF + Nascimento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label required>CPF ou CNPJ</Label>
                <input
                  required
                  value={form.cpf}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, cpf: maskDocument(e.target.value) }))
                  }
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className={inputBase}
                />
              </div>
              <div>
                <Label required>Data de nascimento</Label>
                <input
                  required
                  type="date"
                  value={form.birthDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, birthDate: e.target.value }))
                  }
                  className={`${inputBase} [color-scheme:dark]`}
                />
              </div>
            </div>

            {/* Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Telefone</Label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: maskPhone(e.target.value) }))
                  }
                  placeholder="(11) 99999-9999"
                  inputMode="numeric"
                  className={inputBase}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="h-9 px-5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
              {saveSuccess && (
                <span className="text-sm text-green-400">Salvo com sucesso!</span>
              )}
            </div>
          </form>
        </section>

        {/* Coluna direita */}
        <div className="flex flex-col gap-4">
          {/* Segurança */}
          <section className="p-4 bg-[#111111] rounded-2xl border border-white/5 flex-1">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
              Segurança
            </h2>
            <p className="text-xs text-neutral-600 mb-3 leading-relaxed">
              Enviaremos um link de redefinição para{' '}
              <span className="text-neutral-400">{user?.email}</span>.
            </p>
            <button
              onClick={handlePasswordReset}
              disabled={passwordSent}
              className="w-full h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {passwordSent ? '✓ Email enviado' : 'Alterar senha'}
            </button>
          </section>

          {/* Sessão */}
          <section className="p-4 bg-[#111111] rounded-2xl border border-red-500/10">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
              Sessão
            </h2>
            <p className="text-xs text-neutral-600 mb-3 leading-relaxed">
              Encerra sua sessão e retorna à página inicial.
            </p>
            <button
              onClick={handleLogout}
              className="w-full h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-semibold transition-colors"
            >
              Sair da conta
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
