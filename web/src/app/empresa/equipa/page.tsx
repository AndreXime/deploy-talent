'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiRequestError } from '@/lib/api/client'
import { inviteRecruiterRequest } from '@/lib/api/invitations-api'
import { getCurrentTenantRecruiters, removeCurrentTenantRecruiter } from '@/lib/api/tenants-api'
import type { TenantRecruiterItem } from '@/lib/api/types'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

const RECRUITERS_QUERY_KEY = ['tenant', 'current', 'recruiters'] as const

function recruiterInitials(email: string): string {
  const [local] = email.split('@')
  if (!local) return '?'
  const parts = local.split(/[._\-+]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

function formatJoinedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TeamPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { claims, hydrated } = useAuth()
  const [email, setEmail] = useState('')
  const [removeTarget, setRemoveTarget] = useState<TenantRecruiterItem | null>(null)

  useEffect(() => {
    if (!hydrated) return
    if (claims?.role && claims.role !== 'TENANT_ADMIN') {
      router.replace(homePathForRole(claims.role))
    }
  }, [claims?.role, hydrated, router])

  const recruitersQ = useQuery({
    enabled: hydrated && claims?.role === 'TENANT_ADMIN' && Boolean(claims),
    queryKey: RECRUITERS_QUERY_KEY,
    queryFn: () => getCurrentTenantRecruiters(),
  })

  const inviteMut = useMutation({
    mutationFn: () => inviteRecruiterRequest({ email: email.trim() }),
    onSuccess: (res) => {
      toast.success(`Convite enviado para ${res.email}. O link expira em breve.`)
      setEmail('')
      void queryClient.invalidateQueries({ queryKey: RECRUITERS_QUERY_KEY })
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível enviar o convite.')
    },
  })

  const removeMut = useMutation({
    mutationFn: (userId: string) => removeCurrentTenantRecruiter(userId),
    onSuccess: (_data, userId) => {
      toast.success('Recrutador removido da equipe.')
      queryClient.setQueryData<TenantRecruiterItem[]>(RECRUITERS_QUERY_KEY, (prev) =>
        prev?.filter((rec) => rec.id !== userId),
      )
      setRemoveTarget(null)
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível remover o recrutador.')
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
  const recruiters = recruitersQ.data ?? []

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Equipe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Veja quem já tem acesso e envie convites para novos recrutadores. O destinatário define a
          sua própria senha ao aceitar o convite.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recrutadores ativos</CardTitle>
          <CardDescription>Contas com papel `RECRUITER` no contexto desta empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          {recruitersQ.isLoading ? (
            <RecruiterListSkeleton />
          ) : recruitersQ.isError ? (
            <p className="text-sm text-destructive">
              Não foi possível carregar a equipe. Tente recarregar a página.
            </p>
          ) : recruiters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há recrutadores. Envie o primeiro convite abaixo.
            </p>
          ) : (
            <ul className="divide-y">
              {recruiters.map((rec) => (
                <RecruiterRow
                  key={rec.id}
                  recruiter={rec}
                  onRequestRemove={() => setRemoveTarget(rec)}
                  removing={removeMut.isPending && removeTarget?.id === rec.id}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Convidar para a equipe</CardTitle>
          <CardDescription>
            Envie um link único por email. Não definimos nem mostramos senhas aqui.
          </CardDescription>
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
              O link de ativação só pode ser usado uma vez e expira em poucas horas.
            </p>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!canSubmit}>
              {inviteMut.isPending ? 'Enviando convite…' : 'Enviar convite'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Dialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open && !removeMut.isPending) setRemoveTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover recrutador?</DialogTitle>
            <DialogDescription>
              {removeTarget ? (
                <>
                  A conta de <span className="font-medium">{removeTarget.email}</span> perde
                  imediatamente o acesso à plataforma. O histórico de candidaturas, transições e
                  avaliações permanece, sem o nome do autor.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={removeMut.isPending}
              onClick={() => setRemoveTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={removeMut.isPending}
              onClick={() => {
                if (removeTarget) removeMut.mutate(removeTarget.id)
              }}
            >
              {removeMut.isPending ? 'A remover…' : 'Remover acesso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

interface RecruiterRowProps {
  recruiter: TenantRecruiterItem
  removing: boolean
  onRequestRemove: () => void
}

function RecruiterRow({ recruiter, removing, onRequestRemove }: RecruiterRowProps) {
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <Avatar size="lg">
        {recruiter.avatarUrl ? <AvatarImage src={recruiter.avatarUrl} alt="" /> : null}
        <AvatarFallback>{recruiterInitials(recruiter.email)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{recruiter.email}</p>
        <p className="text-xs text-muted-foreground">
          Na equipe desde {formatJoinedAt(recruiter.createdAt)}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={removing}
        onClick={onRequestRemove}
        aria-label={`Remover ${recruiter.email}`}
        title="Remover recrutador"
      >
        <Trash2 className="size-4 text-destructive" aria-hidden />
      </Button>
    </li>
  )
}

function RecruiterListSkeleton() {
  return (
    <ul className="divide-y">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  )
}
