'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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
import { ApiRequestError } from '@/lib/api/client'
import { inviteRecruiterRequest } from '@/lib/api/invitations-api'
import { requireSessionToken } from '@/lib/require-session-token'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

export default function InviteRecruiterPage() {
  const router = useRouter()
  const { claims, hydrated, token } = useAuth()
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!hydrated) return
    if (claims?.role && claims.role !== 'TENANT_ADMIN') {
      router.replace(homePathForRole(claims.role))
    }
  }, [claims?.role, hydrated, router])

  const inviteMut = useMutation({
    mutationFn: () => inviteRecruiterRequest(requireSessionToken(token), { email: email.trim() }),
    onSuccess: (res) => {
      toast.success(`Convite enviado para ${res.email}. O link expira em breve.`)
      setEmail('')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível enviar o convite.')
    },
  })

  if (!hydrated || claims?.role !== 'TENANT_ADMIN') {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        A validar permissões…
      </div>
    )
  }

  const canSubmit = email.trim().length > 3 && !inviteMut.isPending

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Convidar à equipa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie um link único por email. O destinatário define a sua própria palavra passe ao
          aceitar o convite.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recrutador</CardTitle>
          <CardDescription>Esta conta acede apenas ao contexto desta empresa.</CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (canSubmit) inviteMut.mutate()
          }}
        >
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv_email">Email corporativo ou pessoal</Label>
              <Input
                id="inv_email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Não definimos nem mostramos palavras passe aqui. O link de ativação só pode ser usado
              uma vez.
            </p>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!canSubmit}>
              {inviteMut.isPending ? 'A enviar convite…' : 'Enviar convite'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
