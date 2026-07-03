'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { DemoLoginQuickFill } from '@/components/demo-login-quick-fill'
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
import { loginRequest } from '@/lib/api/auth-api'
import { ApiRequestError } from '@/lib/api/client'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

interface LoginFormProps {
  isDemo?: boolean
}

export function LoginForm({ isDemo = false }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const { setSessionClaims } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginRequest({ email, password })
      setSessionClaims(res)
      toast.success('Sessão iniciada.')
      const next = redirect?.startsWith('/') ? redirect : homePathForRole(res.role)
      router.replace(next)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.message)
      } else {
        toast.error('Algo correu mal.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Entrar</CardTitle>
          <CardDescription>
            Use as credenciais que recebeu. Sua conta abre diretamente na área certa.
          </CardDescription>
        </CardHeader>
        <form onSubmit={submitLogin}>
          <CardContent className="grid gap-4">
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
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-4">
            <Button type="submit" className="min-h-11 w-full rounded-full" disabled={loading}>
              {loading ? 'A entrar…' : 'Entrar'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              É candidato e ainda não tem conta?{' '}
              <Link href="/cadastro" className="font-medium underline-offset-4 hover:underline">
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {isDemo ? (
        <DemoLoginQuickFill
          onSelect={(nextEmail, nextPassword) => {
            setEmail(nextEmail)
            setPassword(nextPassword)
          }}
        />
      ) : null}
    </div>
  )
}
