import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { DemoEnvironmentBanner } from '@/components/demo-environment-banner'
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

export const metadata: Metadata = {
  title: 'Deploy Talent',
  description: 'Plataforma de recrutamento multi-tenant.',
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <DemoEnvironmentBanner />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
