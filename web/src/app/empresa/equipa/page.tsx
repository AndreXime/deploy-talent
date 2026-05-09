'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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
import { createRecruiterRequest } from '@/lib/api/auth-api'
import { ApiRequestError } from '@/lib/api/client'
import { getApiBaseUrl } from '@/lib/env'
import { requireSessionToken } from '@/lib/require-session-token'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

export default function InviteRecruiterPage() {
  const router = useRouter()
  const { claims, hydrated, token } = useAuth()
  const noApi = !getApiBaseUrl()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!hydrated) return
    if (claims?.role && claims.role !== 'TENANT_ADMIN') {
      router.replace(homePathForRole(claims.role))
    }
  }, [claims?.role, hydrated, router])

  const mut = useMutation({
    mutationFn: () =>
      createRecruiterRequest(requireSessionToken(token), { email: email.trim(), password }),
    onSuccess: () => {
      toast.success('Nova conta da equipa criada. Envie estas credenciais com segurança.')
      setEmail('')
      setPassword('')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Pedido incompleto.')
    },
  })

  if (!hydrated || claims?.role !== 'TENANT_ADMIN') {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        A validar permissões…
      </div>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Convidar à equipa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cria uma conta de revisão de perfis alinhada a esta empresa. Partilhe a palavra-passe por
          um canal seguro fora daqui.
        </p>
      </div>
      {noApi && (
        <Alert variant="destructive">
          <AlertDescription>
            Defina <code>NEXT_PUBLIC_API_BASE_URL</code>.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Recrutador</CardTitle>
          <CardDescription>Esta conta acede apenas ao contexto desta empresa.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="inv-email">E-mail corporativo ou pessoal</Label>
            <Input
              id="inv-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-pass">Palavra-passe inicial</Label>
            <Input
              id="inv-pass"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="button" disabled={mut.isPending || noApi} onClick={() => mut.mutate()}>
            {mut.isPending ? 'A criar…' : 'Criar utilização'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
