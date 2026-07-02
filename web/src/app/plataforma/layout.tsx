'use client'

import { Briefcase } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

export default function PlatformLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const pathname = usePathname()
  const { hydrated, claims, signOut } = useAuth()

  useEffect(() => {
    if (!hydrated) return
    if (!claims) {
      router.replace(`/entrar?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    if (claims?.role !== 'SUPER_ADMIN') {
      router.replace(homePathForRole(claims?.role ?? ''))
    }
  }, [claims, hydrated, pathname, router])

  if (!hydrated) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (claims?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        A redirecionar…
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-[var(--z-sticky-nav)] border-b border-border bg-background/90 backdrop-blur-md">
        <div className="page-container flex h-14 max-w-5xl items-center gap-4">
          <Link
            href="/plataforma/empresas"
            className="flex min-w-0 items-center gap-2.5 font-display font-semibold tracking-tight"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Briefcase className="size-4" aria-hidden />
            </span>
            <span className="truncate">Gestão da plataforma</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="ml-auto min-h-11"
            onClick={() => {
              signOut()
              router.replace('/')
            }}
          >
            Sair
          </Button>
        </div>
      </header>
      <Separator />
      <div className="page-container mx-auto flex w-full max-w-5xl flex-1 flex-col py-8">
        {children}
      </div>
    </div>
  )
}
