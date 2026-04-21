'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Camera, Loader2 } from 'lucide-react'
import { db, auth, storage } from '@/lib/firebase'
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
  const { user, profile, logout, refreshUser } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState<FormData>({ cpf: '', phone: '', birthDate: '' })
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [passwordSent, setPasswordSent] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

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

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    e.target.value = ''

    const preview = URL.createObjectURL(file)
    setLocalPhotoUrl(preview)
    setUploadingPhoto(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `users/${user.uid}/avatar.${ext}`
      const snap = await uploadBytes(storageRef(storage, path), file)
      const url = await getDownloadURL(snap.ref)
      await updateProfile(user, { photoURL: url })
      await setDoc(doc(db, 'users', user.uid), { photoURL: url }, { merge: true })
      await refreshUser()
    } catch {
      setLocalPhotoUrl(null)
    } finally {
      setUploadingPhoto(false)
    }
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
      <div>
        <div className="h-7 w-36 bg-white/5 rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="h-72 bg-[#111111] rounded-2xl border border-white/5 animate-pulse" />
          <div className="h-72 bg-[#111111] rounded-2xl border border-white/5 animate-pulse" />
        </div>
        <div className="h-20 bg-[#111111] rounded-2xl border border-white/5 animate-pulse" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-neutral-400 mt-1 text-sm">Gerencie seus dados e preferências</p>
      </div>

      {/* Linha 1 — Dados pessoais + Segurança lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Dados pessoais */}
        <section className="p-5 bg-[#111111] rounded-2xl border border-white/5 flex flex-col">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">
            Dados pessoais
          </h2>

          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/5">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="relative group shrink-0 w-14 h-14 rounded-full focus:outline-none"
            >
              <div className="w-14 h-14 rounded-full bg-brand/10 border-2 border-dashed border-brand/30 flex items-center justify-center overflow-hidden">
                {localPhotoUrl || user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={localPhotoUrl ?? user!.photoURL!}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-brand/60">{initials}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingPhoto
                  ? <Loader2 size={15} className="text-white animate-spin" />
                  : <Camera size={15} className="text-white" />
                }
              </div>
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5 truncate">{user?.email}</p>
              <p className="text-xs text-neutral-600 mt-1.5">
                {uploadingPhoto ? 'Enviando foto...' : 'Clique no avatar para trocar a foto'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-3 flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome</Label>
                <input disabled value={profile?.name ?? ''} className={inputDisabled} />
              </div>
              <div>
                <Label>Email</Label>
                <input disabled value={user?.email ?? ''} className={inputDisabled} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>CPF ou CNPJ</Label>
                <input
                  required
                  value={form.cpf}
                  onChange={(e) => setForm((p) => ({ ...p, cpf: maskDocument(e.target.value) }))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className={inputBase}
                />
              </div>
              <div>
                <Label required>Nascimento</Label>
                <input
                  required
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))}
                  className={`${inputBase} [color-scheme:dark]`}
                />
              </div>
            </div>

            <div>
              <Label>Telefone</Label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: maskPhone(e.target.value) }))}
                placeholder="(11) 99999-9999"
                inputMode="numeric"
                className={inputBase}
              />
            </div>

            <div className="flex items-center gap-3 pt-2 mt-auto">
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

        {/* Segurança */}
        <section className="p-5 bg-[#111111] rounded-2xl border border-white/5 flex flex-col">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">
            Segurança
          </h2>

          <div className="flex-1 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-sm font-medium text-white mb-1">Redefinir senha</p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Enviaremos um link de redefinição para{' '}
                  <span className="text-neutral-300">{user?.email}</span>.
                </p>
                <button
                  onClick={handlePasswordReset}
                  disabled={passwordSent}
                  className="mt-3 h-9 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {passwordSent ? '✓ Email enviado' : 'Enviar link'}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-sm font-medium text-white mb-1">Autenticação</p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Login via provedor{' '}
                  <span className="text-neutral-300 font-medium">
                    {user?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email/senha'}
                  </span>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-sm font-medium text-white mb-1">Última atividade</p>
                <p className="text-xs text-neutral-500">
                  Conta criada em{' '}
                  <span className="text-neutral-300">
                    {user?.metadata?.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString('pt-BR')
                      : '—'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Linha 2 — Sessão esticada full width */}
      <section className="p-5 bg-[#111111] rounded-2xl border border-red-500/10">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
              Sessão
            </h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Encerra sua sessão atual e retorna à página inicial.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 h-9 px-5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-semibold transition-colors"
          >
            Sair da conta
          </button>
        </div>
      </section>
    </div>
  )
}
