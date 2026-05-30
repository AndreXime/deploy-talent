'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { PublicHeader } from '@/components/public-header'
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
import { registerCandidateRequest, registerTenantAdminRequest } from '@/lib/api/auth-api'
import { ApiRequestError } from '@/lib/api/client'
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
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader>
            <CardTitle>Criar conta</CardTitle>
            <CardDescription>
              {mode === 'candidate'
                ? 'Um único perfil para todas as suas candidaturas.'
                : 'Pedido de empresa na plataforma. A moderação ativa a conta antes do primeiro acesso.'}
            </CardDescription>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-2">
              <Button
                type="button"
                variant={mode === 'candidate' ? 'default' : 'outline'}
                className="w-full sm:flex-1"
                onClick={() => setMode('candidate')}
              >
                Candidato
              </Button>
              <Button
                type="button"
                variant={mode === 'tenant_admin' ? 'default' : 'outline'}
                className="w-full sm:flex-1"
                onClick={() => setMode('tenant_admin')}
              >
                Empresa
              </Button>
            </div>
          </CardHeader>
          <form onSubmit={submitRegister}>
            <CardContent className="grid gap-4">
              {mode === 'candidate' ? (
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
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="company">Nome da empresa</Label>
                  <Input
                    id="company"
                    autoComplete="organization"
                    required
                    minLength={2}
                    maxLength={120}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              )}
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
                {loading
                  ? 'Enviando…'
                  : mode === 'candidate'
                    ? 'Criar conta'
                    : 'Pedir cadastro de empresa'}
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
