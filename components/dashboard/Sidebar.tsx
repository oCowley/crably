'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingBag, FolderOpen, Settings, LogOut, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const NAV = [
  { href: '/dashboard/contratar', label: 'Contratar site', icon: ShoppingBag },
  { href: '/dashboard/projetos', label: 'Meus projetos', icon: FolderOpen },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
]

interface Props {
  mobileOpen: boolean
  onClose: () => void
}

export default function DashboardSidebar({ mobileOpen, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, logout } = useAuth()

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  return (
    <>
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-60 flex flex-col',
          'bg-[#0d0d0d] border-r border-white/5',
          'transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/5 shrink-0">
          <Image
            src="/images/icone-crably.png"
            alt="Crably"
            width={32}
            height={32}
            className="rounded-xl shrink-0"
          />
          <span className="font-bold text-white tracking-tight text-lg flex-1">
            crably
          </span>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-neutral-500 hover:text-white transition-colors"
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center gap-3 py-3 pr-4 rounded-xl text-sm transition-all duration-200',
                  active
                    ? 'bg-white/5 text-white border-l-2 border-brand pl-[14px]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent pl-[14px]',
                ].join(' ')}
              >
                <Icon size={18} className="shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="py-4 px-3 border-t border-white/5 shrink-0 space-y-1">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0 overflow-hidden">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt=""
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-brand">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.name ?? '—'}
              </p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-neutral-500 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
          >
            <LogOut size={18} className="shrink-0" />
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  )
}
