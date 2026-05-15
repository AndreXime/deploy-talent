'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PublicHeader } from '@/components/public-header'
import { Skeleton } from '@/components/ui/skeleton'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

export default function CandidateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const pathname = usePathname()
  const { hydrated, claims } = useAuth()

  useEffect(() => {
    if (!hydrated) return
    if (!claims) {
      router.replace(`/entrar?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    if (claims.role !== 'CANDIDATE') {
      router.replace(homePathForRole(claims.role))
    }
  }, [claims, hydrated, pathname, router])

  if (!hydrated) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full max-w-xl" />
      </div>
    )
  }

  if (!claims || claims.role !== 'CANDIDATE') {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        A redirecionar…
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">{children}</div>
    </div>
  )
}
