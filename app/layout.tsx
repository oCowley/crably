import type { Metadata } from 'next'
import { Geist, Fira_Code } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const firaCode = Fira_Code({
  variable: '--font-fira-code',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: {
    default: 'Crably — Sites premium prontos para lançar',
    template: '%s | Crably',
  },
  description:
    'A Crably entrega sites premium prontos para produção com design, desenvolvimento e entrega garantidos. Escolha um site, pague e acompanhe seu projeto.',
  icons: {
    icon: '/images/icone-crably.png',
    apple: '/images/icone-crably.png',
  },
  openGraph: {
    title: 'Crably — Sites premium prontos para lançar',
    description:
      'Sites premium com design, desenvolvimento e entrega garantidos.',
    type: 'website',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Crably — Sites premium prontos para lançar' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crably — Sites premium prontos para lançar',
    description: 'Sites premium com design, desenvolvimento e entrega garantidos.',
    images: ['/images/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${firaCode.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='light'?false:t==='system'?window.matchMedia('(prefers-color-scheme:dark)').matches:true;if(d)document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}})()` }} />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
