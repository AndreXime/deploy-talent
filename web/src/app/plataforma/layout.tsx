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

  if (!claims || claims?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        A redirecionar…
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4 lg:px-6">
          <Link href="/plataforma/empresas" className="flex items-center gap-2 font-semibold">
            <Briefcase className="size-6 text-muted-foreground" aria-hidden />
            Gestão da plataforma
          </Link>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="ml-auto"
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
      <div className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-8 lg:px-6">{children}</div>
    </div>
  )
}
