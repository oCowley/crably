'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { User, Lock, Bell, Shield } from 'lucide-react'

function SectionCard({ title, description, icon: Icon, children }: {
  title: string
  description: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="bento-card overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-brand/10 text-brand">
          <Icon size={16} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-400">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

export default function ConfiguracoesPage() {
  const { profile } = useAuth()
  const [name, setName] = useState(profile?.name ?? '')
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    // TODO: persist to Firestore
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Configurações</h1>
        <p className="text-neutral-500 text-sm">Gerencie seu perfil e preferências da conta.</p>
      </div>

      {/* Top row — 2 cards side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <SectionCard
          title="Perfil"
          description="Informações básicas da sua conta"
          icon={User}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/30 to-brand/5 border border-brand/20 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-brand">
                  {(profile?.name ?? 'A').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{profile?.name ?? '—'}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{profile?.email ?? '—'}</p>
                <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                  {profile?.role === 'developer' ? 'Desenvolvedor' : 'Administrador'}
                </span>
              </div>
            </div>

            <Field label="Nome completo">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="Seu nome"
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={profile?.email ?? ''}
                className={inputCls}
                disabled
                readOnly
              />
              <p className="text-xs text-neutral-600 mt-1">O email não pode ser alterado por aqui.</p>
            </Field>

            <Field label="Função">
              <input
                type="text"
                value={profile?.role === 'developer' ? 'Desenvolvedor' : 'Administrador'}
                className={inputCls}
                disabled
                readOnly
              />
            </Field>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Salvar alterações
              </button>
              {saved && (
                <span className="text-xs text-green-400 animate-fade-in">
                  Salvo com sucesso!
                </span>
              )}
            </div>
          </form>
        </SectionCard>

        {/* Security */}
        <SectionCard
          title="Segurança"
          description="Altere sua senha de acesso"
          icon={Lock}
        >
          <div className="space-y-4">
            <Field label="Senha atual">
              <input type="password" className={inputCls} placeholder="••••••••" />
            </Field>
            <Field label="Nova senha">
              <input type="password" className={inputCls} placeholder="••••••••" />
            </Field>
            <Field label="Confirmar nova senha">
              <input type="password" className={inputCls} placeholder="••••••••" />
            </Field>
            <div className="pt-2">
              <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-xl transition-colors">
                Atualizar senha
              </button>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Second row — 2 cards side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <SectionCard
          title="Notificações"
          description="Escolha quais alertas deseja receber"
          icon={Bell}
        >
          <div className="space-y-3">
            {[
              { label: 'Novo pedido recebido', description: 'Notificar quando um novo pedido é criado' },
              { label: 'Ticket aberto', description: 'Notificar quando um cliente abre um ticket' },
              { label: 'Projeto entregue', description: 'Notificar quando um dev marca projeto como entregue' },
            ].map((item) => (
              <label
                key={item.label}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div>
                  <p className="text-sm text-white">{item.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{item.description}</p>
                </div>
                <div className="relative shrink-0">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 rounded-full bg-white/10 peer-checked:bg-brand transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all peer-checked:translate-x-4" />
                </div>
              </label>
            ))}
          </div>
        </SectionCard>

        {/* Placeholder for future card */}
        <div className="bento-card p-6 flex flex-col items-center justify-center gap-3 border-dashed opacity-40">
          <p className="text-xs text-neutral-500">Em breve</p>
        </div>
      </div>

      {/* Danger zone — full width */}
      <div className="bento-card overflow-hidden border-red-400/10">
        <div className="px-6 py-5 border-b border-red-400/10 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-400/10 text-red-400">
            <Shield size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Zona de risco</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Ações irreversíveis da conta</p>
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div>
              <p className="text-sm font-medium text-red-400">Desativar conta</p>
              <p className="text-xs text-neutral-500 mt-1">
                Isso irá desativar seu acesso ao painel. A ação pode ser revertida pelo suporte.
              </p>
            </div>
            <button className="shrink-0 px-4 py-2 text-xs font-semibold text-red-400 border border-red-400/30 rounded-xl hover:bg-red-400/10 transition-colors">
              Solicitar desativação
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
