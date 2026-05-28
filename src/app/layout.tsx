import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, JetBrains_Mono, Bricolage_Grotesque } from 'next/font/google'
import SwRegister from '@/components/SwRegister'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const bricolageGrotesque = Bricolage_Grotesque({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'MeuTreino',
  description: 'Seu app de treino personalizado',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'MeuTreino' },
}

export const viewport: Viewport = {
  themeColor: '#0d0e12',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${bricolageGrotesque.variable} h-full`}>
      <body className="h-full bg-app text-white antialiased font-body">
        <SwRegister/>
        {children}
      </body>
    </html>
  )
}
