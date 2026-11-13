import type { Metadata } from 'next'
import { Geist, Geist_Mono, Instrument_Sans } from 'next/font/google'
import { AppProviders } from '@/providers/app-providers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const instrumentSans = Instrument_Sans({
  variable: '--font-instrument-sans',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Deploy Talent',
  description:
    'Plataforma para vagas de tecnologia: publique aberturas, receba candidaturas e acompanhe o processo.',
  applicationName: 'Deploy Talent',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
