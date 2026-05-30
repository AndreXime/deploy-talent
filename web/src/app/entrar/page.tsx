import { Suspense } from 'react'
import { LoginForm } from '@/app/entrar/login-form'
import { DemoLoginCredentials } from '@/components/demo-login-credentials'
import { PublicHeader } from '@/components/public-header'
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
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Use as credenciais que recebeu. Sua conta abre diretamente na área certa.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pb-0">
            <DemoLoginCredentials />
          </CardContent>
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </Card>
      </main>
    </div>
  )
}
