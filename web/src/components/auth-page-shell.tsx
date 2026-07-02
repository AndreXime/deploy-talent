import type { ReactNode } from 'react'
import { PublicHeader } from '@/components/public-header'

interface AuthPageShellProps {
  children: ReactNode
}

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="page-container flex flex-1 flex-col items-center justify-center py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
