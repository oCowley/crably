import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Cowly — Sites premium prontos para lançar',
    template: '%s | Cowly',
  },
  description:
    'A Cowly entrega sites premium prontos para produção com design, desenvolvimento e entrega garantidos. Escolha um template, pague e acompanhe seu projeto.',
  openGraph: {
    title: 'Cowly — Sites premium prontos para lançar',
    description:
      'Templates de sites premium com design, desenvolvimento e entrega garantidos.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
          <AuthProvider>{children}</AuthProvider>
        </body>
    </html>
  )
}
