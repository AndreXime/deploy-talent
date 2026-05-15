'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginRequest } from '@/lib/api/auth-api'
import { ApiRequestError } from '@/lib/api/client'
import { parseJwtClaims } from '@/lib/auth-token'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const { setSession } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginRequest({ email, password })
      setSession(res)
      toast.success('Sessão iniciada.')
      const claims = parseJwtClaims(res.access_token)
      const next = redirect?.startsWith('/') ? redirect : homePathForRole(claims?.role ?? '')
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
          <Label htmlFor="password">Palavra-passe</Label>
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'A entrar…' : 'Entrar'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          É candidato e ainda não tem conta?{' '}
          <Link href="/registo" className="font-medium underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
      </CardFooter>
    </form>
  )
}
