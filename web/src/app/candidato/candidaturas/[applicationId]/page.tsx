'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Building2, MapPin, MonitorSmartphone } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { ApplicationStatusBadge, JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { getMyApplication, withdrawMyApplication } from '@/lib/api/applications-api'
import { ApiRequestError } from '@/lib/api/client'
import { getApiBaseUrl } from '@/lib/env'
import { isUuid } from '@/lib/is-uuid'
import { candidateMayWithdraw } from '@/lib/pipeline-rules'
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'

export default function CandidateApplicationDetailPage() {
  const params = useParams<{ applicationId: string }>()
  const applicationId = params?.applicationId?.trim() ?? ''
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const noApi = !getApiBaseUrl()
  const valid = isUuid(applicationId)

  const [withdrawOpen, setWithdrawOpen] = useState(false)

  const q = useQuery({
    enabled: !!token && valid && !noApi,
    queryKey: ['my-application', token, applicationId],
    queryFn: () => getMyApplication(requireSessionToken(token), applicationId),
  })

  const withdrawMut = useMutation({
    mutationFn: () => withdrawMyApplication(requireSessionToken(token), applicationId),
    onSuccess: () => {
      toast.success('Manifestou desistência com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['my-applications'] })
      queryClient.invalidateQueries({ queryKey: ['my-application', token, applicationId] })
      setWithdrawOpen(false)
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Pedido incompleto.')
    },
  })

  const row = q.data

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
      <Button variant="ghost" size="sm" className="-ml-3 w-fit gap-1 self-start" asChild>
        <Link href="/candidato">
          <ArrowLeft className="size-4" aria-hidden />
          Lista de candidaturas
        </Link>
      </Button>

      {!valid && (
        <Alert variant="destructive">
          <AlertDescription>Identificação inválida.</AlertDescription>
        </Alert>
      )}

      {noApi && (
        <Alert variant="destructive">
          <AlertDescription>
            Defina <code>NEXT_PUBLIC_API_BASE_URL</code>.
          </AlertDescription>
        </Alert>
      )}

      {q.isLoading && <Skeleton className="h-60 w-full max-w-xl" />}

      {q.isError && (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível encontrar esta candidatura.</AlertDescription>
        </Alert>
      )}

      {row && (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{row.job.title}</h1>
            <ApplicationStatusBadge status={row.status} />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <Building2 className="size-4 shrink-0" aria-hidden />
                {row.tenant.name}
              </span>
              <Separator />
              <span className="inline-flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1">
                  <MonitorSmartphone className="size-4" aria-hidden />
                  {row.job.modality}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" aria-hidden />
                  {row.job.location}
                </span>
              </span>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-muted-foreground">Estado da vaga:</span>
                <JobStatusBadge status={row.job.status} audience="public" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Descrição da vaga</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {row.job.description}
              </p>
            </CardContent>
          </Card>

          {candidateMayWithdraw(row.status) && (
            <div className="rounded-lg border border-destructive/30 bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">
                Não vai continuar neste processo? Pode desistir a qualquer momento — o estado será
                actualizado nesta página.
              </p>
              <Button
                variant="destructive"
                className="mt-3"
                type="button"
                onClick={() => setWithdrawOpen(true)}
              >
                Desistir da candidatura
              </Button>
            </div>
          )}

          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Desistência</DialogTitle>
                <DialogDescription>
                  Ao confirmar, deixa de participar neste processo. Se mudar de ideias, terá de
                  contactar a empresa por outra via.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setWithdrawOpen(false)}>
                  Voltar atrás
                </Button>
                <Button type="button" variant="destructive" onClick={() => withdrawMut.mutate()}>
                  {withdrawMut.isPending ? 'A enviar…' : 'Confirmar desistência'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </main>
  )
}
