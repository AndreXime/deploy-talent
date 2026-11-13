'use client'

import { Briefcase, Building2, Eye, EyeOff, Lock, LogIn, Mail, User, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { AuthPageShell } from '@/components/auth-page-shell'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerCandidateRequest, registerTenantAdminRequest } from '@/lib/api/auth-api'
import { ApiRequestError } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth-provider'

type RegisterMode = 'candidate' | 'tenant_admin'

export default function RegisterPage() {
  const router = useRouter()
  const { setSessionClaims } = useAuth()
  const [mode, setMode] = useState<RegisterMode>('candidate')
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'candidate') {
        const res = await registerCandidateRequest({ name, email, password })
        setSessionClaims(res)
        toast.success('Conta criada.')
        router.replace('/candidato')
        return
      }

      await registerTenantAdminRequest({
        companyName: companyName.trim(),
        email,
        password,
      })
      toast.success(
        'Pedido enviado. Quando a plataforma aprovar sua empresa, use Entrar com este e-mail.',
      )
      router.replace('/entrar')
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.message)
      } else {
        toast.error('Não foi possível concluir o cadastro.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell>
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark size={40} className="size-10" />
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              Criar conta
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === 'candidate'
                ? 'Um perfil para candidatar-se a vagas de TI'
                : 'Pedido de empresa para publicar vagas de TI'}
            </p>
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/60 p-1"
          role="tablist"
          aria-label="Tipo de conta"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'candidate'}
            className={cn(
              'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
              mode === 'candidate'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setMode('candidate')}
          >
            <User className="size-4 shrink-0" aria-hidden />
            Candidato
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'tenant_admin'}
            className={cn(
              'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
              mode === 'tenant_admin'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setMode('tenant_admin')}
          >
            <Building2 className="size-4 shrink-0" aria-hidden />
            Empresa
          </button>
        </div>

        <form onSubmit={submitRegister} className="flex flex-col gap-5">
          {mode === 'candidate' ? (
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  placeholder="Seu nome"
                  className="h-11 pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="company">Nome da empresa</Label>
              <div className="relative">
                <Building2
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="company"
                  autoComplete="organization"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Nome da empresa"
                  className="h-11 pl-10"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>
          )}

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
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={200}
                placeholder="Mínimo de 8 caracteres"
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
          </div>

          <Button type="submit" className="mt-1 h-11 w-full gap-2 rounded-xl" disabled={loading}>
            {mode === 'candidate' ? (
              <UserPlus className="size-4" aria-hidden />
            ) : (
              <Briefcase className="size-4" aria-hidden />
            )}
            {loading
              ? 'Enviando…'
              : mode === 'candidate'
                ? 'Criar conta'
                : 'Pedir cadastro de empresa'}
          </Button>
        </form>

        <div className="flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="h-11 w-full gap-2 rounded-xl" asChild>
          <Link href="/entrar">
            <LogIn className="size-4" aria-hidden />
            Já tenho conta
          </Link>
        </Button>
      </div>
    </AuthPageShell>
  )
}
