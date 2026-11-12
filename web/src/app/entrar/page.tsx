import { Suspense } from 'react'
import { LoginForm } from '@/app/entrar/login-form'
import { AuthPageShell } from '@/components/auth-page-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { IS_DEMO } from '@/lib/env'

function LoginFormFallback() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm isDemo={IS_DEMO} />
      </Suspense>
    </AuthPageShell>
  )
}
