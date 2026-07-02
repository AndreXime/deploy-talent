'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Building2, MapPin, MonitorSmartphone } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHead } from '@/components/page-head'
import { CandidateCurrentStageCard } from '@/components/pipeline/candidate-current-stage-card'
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
import { WorkbenchPageShell } from '@/components/workbench-page-shell'
import { getMyApplication, withdrawMyApplication } from '@/lib/api/applications-api'
import { ApiRequestError } from '@/lib/api/client'
import { isUuid } from '@/lib/is-uuid'
import { candidateMayWithdraw } from '@/lib/pipeline-rules'
import { useAuth } from '@/providers/auth-provider'

export default function CandidateApplicationDetailPage() {
  const params = useParams<{ applicationId: string }>()
  const applicationId = params?.applicationId?.trim() ?? ''
  const { claims } = useAuth()
  const queryClient = useQueryClient()
  const valid = isUuid(applicationId)

  const [withdrawOpen, setWithdrawOpen] = useState(false)

  const q = useQuery({
    enabled: !!claims && valid,
    queryKey: ['my-application', claims?.sub, applicationId],
    queryFn: () => getMyApplication(applicationId),
  })

  const withdrawMut = useMutation({
    mutationFn: () => withdrawMyApplication(applicationId),
    onSuccess: () => {
      toast.success('Desistência registrada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['my-applications'] })
      queryClient.invalidateQueries({ queryKey: ['my-application', claims?.sub, applicationId] })
      setWithdrawOpen(false)
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Pedido incompleto.')
    },
  })

  const row = q.data

  return (
    <WorkbenchPageShell className="min-w-0 w-full">
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

      {q.isLoading && <Skeleton className="h-60 w-full" />}

      {q.isError && (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível encontrar esta candidatura.</AlertDescription>
        </Alert>
      )}

      {row && (
        <>
          <PageHead title={row.job.title}>
            <ApplicationStatusBadge status={row.status} />
          </PageHead>

          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Empresa</CardTitle>
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

          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Descrição da vaga</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {row.job.description}
              </p>
            </CardContent>
          </Card>

          <CandidateCurrentStageCard applicationId={applicationId} />

          {candidateMayWithdraw(row.status) && (
            <div className="rounded-lg border border-destructive/30 bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">
                Não vai continuar neste processo? Pode desistir a qualquer momento. O estado será
                atualizado nesta página.
              </p>
              <Button
                variant="destructive"
                className="mt-3 min-h-11"
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
                  Voltar
                </Button>
                <Button type="button" variant="destructive" onClick={() => withdrawMut.mutate()}>
                  {withdrawMut.isPending ? 'Enviando…' : 'Confirmar desistência'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </WorkbenchPageShell>
  )
}
