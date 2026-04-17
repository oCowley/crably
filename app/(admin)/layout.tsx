'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import AdminSidebar from '@/components/admin/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('admin-sidebar-collapsed')
    if (stored !== null) setCollapsed(stored === 'true')
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      localStorage.setItem('admin-sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  return (
    <AuthGuard allowedRoles={['admin', 'developer']}>
      <div className="min-h-screen bg-[#0B0B0B]">
        <AdminSidebar collapsed={collapsed} onToggle={toggle} />

        <main
          className={[
            'min-h-screen transition-all duration-300',
            'pt-14 lg:pt-0',
            collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-72',
          ].join(' ')}
        >
          <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
