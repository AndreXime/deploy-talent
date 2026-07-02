import { Suspense } from 'react'
import { LoginForm } from '@/app/entrar/login-form'
import { AuthPageShell } from '@/components/auth-page-shell'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function LoginFormFallback() {
  return (
    <>
      <CardContent className="grid gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
      <CardFooter className="pt-4">
        <Skeleton className="h-11 w-full" />
      </CardFooter>
    </>
  )
}

export default function LoginPage() {
  return (
    <AuthPageShell>
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Entrar</CardTitle>
          <CardDescription>
            Use as credenciais que recebeu. Sua conta abre diretamente na área certa.
          </CardDescription>
        </CardHeader>
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </Card>
    </AuthPageShell>
  )
}
