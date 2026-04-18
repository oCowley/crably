'use client'

import { useState } from 'react'
import { CartProvider } from '@/contexts/CartContext'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#0B0B0B]">
        <DashboardSidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <div className="lg:pl-60 min-h-screen flex flex-col">
          <DashboardHeader onMenuOpen={() => setMobileOpen(true)} />
          <main className="flex-1 p-5 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </CartProvider>
  )
}
