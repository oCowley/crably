import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0B]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
