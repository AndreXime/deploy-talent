'use client'

import { Briefcase, Eye, EyeOff, Lock, Mail, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { DemoLoginQuickFill } from '@/components/demo-login-quick-fill'
import { Button } from '@/components/ui/button'
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
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          aria-hidden
        >
          <Briefcase className="size-5" />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Entrar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesse sua conta para continuar</p>
        </div>
      </div>

      <form onSubmit={submitLogin} className="flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="seu@email.com"
              className="h-11 pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              minLength={8}
              placeholder="Sua senha"
              className="h-11 pr-11 pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() =>
                toast.message('Recuperação de senha ainda não está disponível.', {
                  description: 'Peça um novo acesso a quem administra a sua conta.',
                })
              }
            >
              Esqueci minha senha
            </button>
          </div>
        </div>

        <Button type="submit" className="mt-1 h-11 w-full gap-2 rounded-xl" disabled={loading}>
          <Briefcase className="size-4" aria-hidden />
          {loading ? 'A entrar…' : 'Entrar'}
        </Button>
      </form>

      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" className="h-11 w-full gap-2 rounded-xl" asChild>
        <Link href="/cadastro">
          <UserPlus className="size-4" aria-hidden />
          Criar conta
        </Link>
      </Button>

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
