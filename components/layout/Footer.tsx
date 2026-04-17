import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-white tracking-tight">cowly</span>
        </div>

        <nav className="flex items-center gap-6">
          <Link href="/products" className="text-sm text-neutral-500 hover:text-white transition-colors">
            Templates
          </Link>
          <Link href="/login" className="text-sm text-neutral-500 hover:text-white transition-colors">
            Entrar
          </Link>
        </nav>

        <p className="text-sm text-neutral-600">
          © {new Date().getFullYear()} Cowly. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
