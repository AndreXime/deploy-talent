import { Suspense } from 'react'
import { LoginForm } from '@/app/entrar/login-form'
import { AuthPageShell } from '@/components/auth-page-shell'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { IS_DEMO } from '@/lib/env'

function LoginFormFallback() {
  return (
    <Card className="border-border shadow-none">
      <CardHeader>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="grid gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
      <CardFooter className="pt-4">
        <Skeleton className="h-11 w-full" />
      </CardFooter>
    </Card>
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
