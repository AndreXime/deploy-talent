'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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
import { Skeleton } from '@/components/ui/skeleton'
import { ApiRequestError } from '@/lib/api/client'
import { acceptInvitationRequest, getInvitationByTokenRequest } from '@/lib/api/invitations-api'
import { parseJwtClaims } from '@/lib/auth-token'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

function formatExpiry(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-PT', { dateStyle: 'long', timeStyle: 'short' })
}

export default function ActivateInvitationPage() {
  const params = useParams<{ token: string }>()
  const token = decodeURIComponent(params?.token ?? '')
  const router = useRouter()
  const { setSession } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const previewQ = useQuery({
    enabled: token.length > 0,
    queryKey: ['invitation', token],
    queryFn: () => getInvitationByTokenRequest(token),
    retry: false,
  })

  const acceptMut = useMutation({
    mutationFn: () => acceptInvitationRequest(token, { password }),
    onSuccess: (res) => {
      setSession(res.access_token)
      const claims = parseJwtClaims(res.access_token)
      toast.success('Conta activada. Bem vindo!')
      router.replace(homePathForRole(claims?.role ?? ''))
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível activar a conta.')
    },
  })

  const passwordsMatch = password.length >= 8 && password === confirm

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader>
            <CardTitle>Activar conta</CardTitle>
            <CardDescription>
              Defina uma palavra passe para concluir o convite e entrar na plataforma.
            </CardDescription>
          </CardHeader>

          {previewQ.isLoading && (
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          )}

          {previewQ.isError && (
            <>
              <CardContent>
                <p className="text-sm text-destructive">
                  {previewQ.error instanceof ApiRequestError
                    ? previewQ.error.message
                    : 'O convite é inválido, foi revogado ou já expirou.'}
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/entrar">Voltar ao início</Link>
                </Button>
              </CardFooter>
            </>
          )}

          {previewQ.data && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (passwordsMatch) acceptMut.mutate()
              }}
            >
              <CardContent className="grid gap-4">
                <dl className="grid gap-1 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-medium">{previewQ.data.email}</dd>
                  </div>
                  {previewQ.data.tenantName && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Empresa</dt>
                      <dd className="font-medium">{previewQ.data.tenantName}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Expira</dt>
                    <dd className="font-medium">{formatExpiry(previewQ.data.expiresAt)}</dd>
                  </div>
                </dl>

                <div className="space-y-2">
                  <Label htmlFor="pw">Nova palavra passe</Label>
                  <Input
                    id="pw"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw2">Repita a palavra passe</Label>
                  <Input
                    id="pw2"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  {confirm.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-destructive">
                      As palavras passe não coincidem ou têm menos de 8 caracteres.
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!passwordsMatch || acceptMut.isPending}
                >
                  {acceptMut.isPending ? 'A activar…' : 'Activar conta'}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </main>
    </div>
  )
}
