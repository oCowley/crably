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
  CalendarDays,
  Briefcase,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ThemeToggle from '@/components/ui/ThemeToggle'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'PRINCIPAL',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/pedidos', label: 'Pedidos', icon: Package },
      { href: '/admin/templates', label: 'Sites', icon: Globe },
      { href: '/admin/clientes', label: 'Clientes', icon: Users },
    ],
  },
  {
    label: 'SUPORTE',
    items: [
      { href: '/admin/tickets', label: 'Tickets', icon: MessageSquare },
      { href: '/admin/devs', label: 'Devs', icon: Code2 },
      { href: '/admin/agendamentos', label: 'Agendamentos', icon: CalendarDays },
    ],
  },
  {
    label: 'PESSOAL',
    items: [
      { href: '/admin/meus-pedidos', label: 'Meus Pedidos', icon: Briefcase },
    ],
  },
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

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  function linkCls(active: boolean) {
    return [
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 border',
      collapsed ? 'lg:justify-center lg:px-0' : '',
      active
        ? 'bg-brand/10 text-brand border-brand/20 font-semibold'
        : 'text-muted hover:text-foreground hover:bg-surface border-transparent',
    ].join(' ')
  }

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-surface border-b border-border flex items-center gap-3 px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-secondary hover:text-foreground hover:bg-elevated transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/images/icone-crably.png" alt="Crably" width={24} height={24} className="rounded-md" />
          <span className="font-bold text-foreground text-sm tracking-tight">crably</span>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-overlay backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col',
          'bg-inset border-r border-border',
          'transition-all duration-300 ease-in-out',
          'w-72',
          collapsed ? 'lg:w-[4.5rem]' : 'lg:w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo + collapse toggle */}
        <div
          className={[
            'h-[72px] flex items-center border-b border-border px-4 shrink-0 gap-3',
            collapsed ? 'lg:justify-center lg:px-0' : '',
          ].join(' ')}
        >
          <div className="w-8 h-8 rounded-xl bg-brand/15 border border-brand/25 flex items-center justify-center shrink-0">
            <Image src="/images/icone-crably.png" alt="Crably" width={20} height={20} className="rounded-md" />
          </div>

          <div className={`flex-1 min-w-0 transition-all duration-200 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="font-bold text-foreground tracking-tight text-[15px] leading-none">crably</p>
            <p className="text-[10px] text-faint mt-0.5 leading-none">Admin</p>
          </div>

          <button
            onClick={onToggle}
            className={[
              'hidden lg:flex items-center justify-center',
              'w-7 h-7 rounded-lg text-faint',
              'hover:text-foreground hover:bg-elevated transition-all duration-200 shrink-0',
            ].join(' ')}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-faint hover:text-foreground transition-colors"
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Main navigation */}
        <nav
          className={[
            'flex-1 py-4 flex flex-col gap-4 overflow-y-auto',
            collapsed ? 'lg:px-2 lg:gap-1' : 'px-3',
          ].join(' ')}
        >
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <p
                className={[
                  'px-3 mb-1.5 text-[10px] font-semibold text-faint tracking-widest',
                  collapsed ? 'lg:hidden' : '',
                ].join(' ')}
              >
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map(({ href, label, icon: Icon, exact }) => (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={linkCls(isActive(href, exact))}
                  >
                    <Icon size={17} className="shrink-0" />
                    <span className={`truncate transition-all duration-200 ${collapsed ? 'lg:hidden' : ''}`}>
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div
          className={[
            'py-3 border-t border-border flex flex-col gap-1 shrink-0',
            collapsed ? 'lg:px-2' : 'px-3',
          ].join(' ')}
        >
          <Link
            href="/admin/configuracoes"
            title={collapsed ? 'Configurações' : undefined}
            className={linkCls(isActive('/admin/configuracoes'))}
          >
            <Settings size={17} className="shrink-0" />
            <span className={`truncate transition-all duration-200 ${collapsed ? 'lg:hidden' : ''}`}>
              Configurações
            </span>
          </Link>

          {/* User card */}
          {!collapsed && (
            <div className="hidden lg:flex items-center gap-3 mx-0 mt-1 px-3 py-2.5 rounded-xl bg-surface border border-border">
              <div className="w-8 h-8 rounded-xl bg-brand/15 border border-brand/25 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-brand">{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate leading-none">
                  {profile?.name?.split(' ')[0] ?? '—'}
                </p>
                <p className="text-[10px] text-faint mt-0.5 truncate">
                  {profile?.role === 'developer' ? 'Desenvolvedor' : 'Administrador'}
                </p>
              </div>
            </div>
          )}

          <div className={`hidden lg:flex items-center mt-1 ${collapsed ? 'justify-center' : 'px-3'}`}>
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            title={collapsed ? 'Sair' : undefined}
            className={[
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-faint',
              'hover:text-danger hover:bg-red-400/5 border border-transparent',
              'transition-all duration-200',
              collapsed ? 'lg:justify-center lg:px-0' : '',
            ].join(' ')}
          >
            <LogOut size={17} className="shrink-0" />
            <span className={`transition-all duration-200 ${collapsed ? 'lg:hidden' : ''}`}>Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}
