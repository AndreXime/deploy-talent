'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { PublicHeader } from '@/components/public-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerCandidateRequest } from '@/lib/api/auth-api'
import { ApiRequestError } from '@/lib/api/client'
import { getApiBaseUrl } from '@/lib/env'
import { useAuth } from '@/providers/auth-provider'

export default function RegisterPage() {
  const router = useRouter()
  const { setSession } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [configError] = useState(() => !getApiBaseUrl())

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault()
    if (configError) {
      toast.error('Configure NEXT_PUBLIC_API_BASE_URL.')
      return
    }
    setLoading(true)
    try {
      const res = await registerCandidateRequest({ name, email, password })
      setSession(res.access_token)
      toast.success('Conta criada.')
      router.replace('/candidato')
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.message)
      } else {
        toast.error('Não foi possível criar a conta.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader>
            <CardTitle>Criar conta — candidato</CardTitle>
            <CardDescription>Um só perfil para todas as suas candidaturas.</CardDescription>
          </CardHeader>
          <form onSubmit={submitRegister}>
            <CardContent className="grid gap-4">
              {configError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Falta configurar <code>NEXT_PUBLIC_API_BASE_URL</code>.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Palavra-passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={200}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'A criar conta…' : 'Criar conta'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem conta?{' '}
                <Link href="/entrar" className="font-medium underline-offset-4 hover:underline">
                  Entrar
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}
