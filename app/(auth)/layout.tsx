import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col">
      {/* Minimal header */}
      <header className="px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/icone-crably.png" alt="Crably" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-white text-lg tracking-tight">crably</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  )
}
