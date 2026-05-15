'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { CompanyShell } from '@/components/company-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

export default function CompanyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const pathname = usePathname()
  const { hydrated, claims } = useAuth()

  const allowed = claims?.role === 'TENANT_ADMIN' || claims?.role === 'RECRUITER'

  useEffect(() => {
    if (!hydrated) return
    if (!claims) {
      router.replace(`/entrar?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    if (!allowed) {
      router.replace(homePathForRole(claims.role))
    }
  }, [allowed, claims, hydrated, pathname, router])

  if (!hydrated) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (!claims || !allowed) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        A redirecionar…
      </div>
    )
  }

  return <CompanyShell>{children}</CompanyShell>
}
