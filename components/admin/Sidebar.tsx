'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Globe,
  Users,
  MessageSquare,
  Code2,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Menu,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: Package },
  { href: '/admin/templates', label: 'Sites', icon: Globe },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/tickets', label: 'Tickets', icon: MessageSquare },
  { href: '/admin/devs', label: 'Devs', icon: Code2 },
]

export default function AdminSidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  function linkCls(active: boolean) {
    return [
      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 border',
      collapsed ? 'lg:justify-center lg:px-0' : '',
      active
        ? 'bg-brand/10 text-brand border-brand/20'
        : 'text-neutral-400 hover:text-white hover:bg-white/5 border-transparent',
    ].join(' ')
  }

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-[#111111] border-b border-white/5 flex items-center gap-3 px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/images/icone-crably.png" alt="Crably" width={24} height={24} className="rounded-md" />
          <span className="font-bold text-white text-sm tracking-tight">crably</span>
        </div>
      </header>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col',
          'bg-[#111111] border-r border-white/5',
          'transition-all duration-300 ease-in-out',
          /* mobile always full width drawer */
          'w-72',
          /* desktop: collapsed = icon-only strip, expanded = w-72 */
          collapsed ? 'lg:w-[4.5rem]' : 'lg:w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo + collapse toggle */}
        <div className={[
          'h-16 flex items-center border-b border-white/5 px-4 shrink-0 gap-3',
          collapsed ? 'lg:justify-center lg:px-0' : '',
        ].join(' ')}>
          <Image src="/images/icone-crably.png" alt="Crably" width={32} height={32} className="rounded-xl shrink-0" />

          {/* Label + role badge – hidden when collapsed */}
          <div className={`flex-1 min-w-0 transition-all duration-200 ${collapsed ? 'lg:hidden' : ''}`}>
            <span className="font-bold text-white tracking-tight">crably</span>
          </div>

          {/* Desktop collapse arrow */}
          <button
            onClick={onToggle}
            className={[
              'hidden lg:flex items-center justify-center',
              'w-7 h-7 rounded-lg text-neutral-500',
              'hover:text-white hover:bg-white/8 transition-all duration-200 shrink-0',
              collapsed ? 'rotate-0' : '',
            ].join(' ')}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed
              ? <ChevronRight size={16} />
              : <ChevronLeft size={16} />
            }
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-neutral-500 hover:text-white transition-colors"
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Main navigation */}
        <nav className={[
          'flex-1 py-4 flex flex-col gap-0.5 overflow-y-auto',
          collapsed ? 'lg:px-2' : 'px-3',
        ].join(' ')}>
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={linkCls(isActive(href, exact))}
            >
              <Icon size={18} className="shrink-0" />
              <span className={`truncate transition-all duration-200 ${collapsed ? 'lg:hidden' : ''}`}>
                {label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className={[
          'py-4 border-t border-white/5 flex flex-col gap-0.5 shrink-0',
          collapsed ? 'lg:px-2' : 'px-3',
        ].join(' ')}>
          <Link
            href="/admin/configuracoes"
            title={collapsed ? 'Configurações' : undefined}
            className={linkCls(isActive('/admin/configuracoes'))}
          >
            <Settings size={18} className="shrink-0" />
            <span className={`truncate transition-all duration-200 ${collapsed ? 'lg:hidden' : ''}`}>
              Configurações
            </span>
          </Link>

          {/* User profile card */}
          {!collapsed && (
            <div className="hidden lg:block mx-1 mb-1 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
              <p
                className="text-base font-bold truncate"
                style={{ color: '#F97316', textShadow: '0 0 18px rgba(249,115,22,0.55)' }}
              >
                {profile?.name ?? '—'}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5 truncate">
                {profile?.role === 'developer' ? 'Desenvolvedor' : 'Administrador'}
              </p>
            </div>
          )}

          <button
            onClick={handleLogout}
            title={collapsed ? 'Sair' : undefined}
            className={[
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-neutral-500',
              'hover:text-red-400 hover:bg-red-400/5 border border-transparent',
              'transition-all duration-200',
              collapsed ? 'lg:justify-center lg:px-0' : '',
            ].join(' ')}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`transition-all duration-200 ${collapsed ? 'lg:hidden' : ''}`}>
              Sair
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
