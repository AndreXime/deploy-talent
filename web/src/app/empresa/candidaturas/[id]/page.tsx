'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { type ReactNode, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHead } from '@/components/page-head'
import { StageProgressTimeline } from '@/components/pipeline/stage-progress-timeline'
import { ApplicationStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkbenchPageShell } from '@/components/workbench-page-shell'
import { getTenantApplication, moveApplication } from '@/lib/api/applications-api'
import { ApiRequestError } from '@/lib/api/client'
import {
  listApplicationProgress,
  listJobStages,
  moveApplicationStage,
  setStageInterviewLink,
} from '@/lib/api/pipelines-api'
import type { ApiApplicationStatus } from '@/lib/api/types'
import { applicationStatusLabel } from '@/lib/domain-labels'
import { isUuid } from '@/lib/is-uuid'
import { nextApplicationStatuses } from '@/lib/pipeline-rules'
import { useAuth } from '@/providers/auth-provider'

export default function TenantApplicationDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id?.trim() ?? ''
  const { claims } = useAuth()
  const qc = useQueryClient()
  const valid = isUuid(id)

  const [targetStageId, setTargetStageId] = useState('')

  const appQ = useQuery({
    enabled: !!claims && valid,
    queryKey: ['tenant-application', claims?.sub, id],
    queryFn: () => getTenantApplication(id),
  })

  const jobId = appQ.data?.jobId

  const stagesQ = useQuery({
    enabled: !!claims && !!jobId,
    queryKey: ['job-stages', claims?.sub, jobId],
    queryFn: () => listJobStages(jobId as string),
  })

  const progressQ = useQuery({
    enabled: !!claims && valid,
    queryKey: ['application-progress', claims?.sub, id],
    queryFn: () => listApplicationProgress(id),
  })

  const moveMut = useMutation({
    mutationFn: (input: { status: ApiApplicationStatus }) => moveApplication(id, input),
    onSuccess: () => {
      toast.success('Funil atualizado.')
      qc.invalidateQueries({ queryKey: ['tenant-application', claims?.sub, id] })
      qc.invalidateQueries({ queryKey: ['tenant-applications', claims?.sub] })
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Transição inválida.')
    },
  })

  const moveStageMut = useMutation({
    mutationFn: (jobStageId: string) => moveApplicationStage(id, jobStageId),
    onSuccess: () => {
      toast.success('Etapa atualizada.')
      qc.invalidateQueries({ queryKey: ['tenant-application', claims?.sub, id] })
      qc.invalidateQueries({ queryKey: ['application-progress', claims?.sub, id] })
      setTargetStageId('')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível mover a etapa.')
    },
  })

  const [interviewUrl, setInterviewUrl] = useState('')
  const [interviewScheduledAt, setInterviewScheduledAt] = useState('')

  const interviewMut = useMutation({
    mutationFn: (jobStageId: string) =>
      setStageInterviewLink(id, jobStageId, {
        url: interviewUrl.trim(),
        scheduledAt:
          interviewScheduledAt.trim().length > 0
            ? new Date(interviewScheduledAt).toISOString()
            : undefined,
      }),
    onSuccess: () => {
      toast.success('Link de entrevista atualizado.')
      qc.invalidateQueries({ queryKey: ['application-progress', claims?.sub, id] })
      setInterviewUrl('')
      setInterviewScheduledAt('')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível salvar o link.')
    },
  })

  const row = appQ.data
  const next = row ? nextApplicationStatuses(row.status) : []
  const currentStage = row?.currentJobStageId
    ? (stagesQ.data ?? []).find((s) => s.id === row.currentJobStageId)
    : undefined

  return (
    <WorkbenchPageShell className="max-w-3xl">
      <Button variant="outline" size="sm" className="w-fit" asChild>
        <Link href="/empresa/candidaturas">Lista de candidaturas</Link>
      </Button>

      {!valid && (
        <Alert variant="destructive">
          <AlertDescription>Identificação inválida.</AlertDescription>
        </Alert>
      )}

      {appQ.isLoading && <Skeleton className="h-80 w-full" />}
      {appQ.isError && (
        <Alert variant="destructive">
          <AlertDescription>Candidatura não encontrada.</AlertDescription>
        </Alert>
      )}

      {row && (
        <>
          <PageHead title={row.candidate.name}>
            <ApplicationStatusBadge status={row.status} />
          </PageHead>

          <Card className="rounded-2xl border-border shadow-[0_10px_30px_oklch(18%_0.008_60/0.04)]">
            <CardHeader>
              <CardTitle className="font-display text-lg">Dados do candidato</CardTitle>
              <CardDescription>Visíveis apenas à equipe de recrutamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">E-mail: </span>
                {row.candidate.email}
              </p>
              {row.candidate.phone && (
                <p>
                  <span className="text-muted-foreground">Telefone: </span>
                  {row.candidate.phone}
                </p>
              )}
              {row.candidate.resumeUrl && (
                <p>
                  <span className="text-muted-foreground">Currículo: </span>
                  <a
                    href={row.candidate.resumeUrl}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir arquivo
                  </a>
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border shadow-[0_10px_30px_oklch(18%_0.008_60/0.04)]">
            <CardHeader>
              <CardTitle className="font-display text-lg">Vaga associada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{row.job.title}</p>
              <p className="text-muted-foreground">
                {row.job.modality} · {row.job.location}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border shadow-[0_10px_30px_oklch(18%_0.008_60/0.04)]">
            <CardHeader>
              <CardTitle className="font-display text-lg">Etapas da pipeline</CardTitle>
              <CardDescription>
                Mover a candidatura para outra etapa. O candidato vê a etapa atual no portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stagesQ.isLoading || progressQ.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <StageProgressTimeline
                  stages={stagesQ.data ?? []}
                  progress={progressQ.data ?? []}
                  currentJobStageId={row.currentJobStageId ?? null}
                />
              )}

              {row.status !== 'REJECTED' &&
                row.status !== 'WITHDRAWN' &&
                row.status !== 'HIRED' &&
                (stagesQ.data ?? []).length > 0 && (
                  <StageTargetSelect
                    stages={stagesQ.data ?? []}
                    value={targetStageId}
                    onChange={setTargetStageId}
                    onMove={() => moveStageMut.mutate(targetStageId)}
                    moving={moveStageMut.isPending}
                  />
                )}

              {currentStage?.kind === 'INTERVIEW_LINK' && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-sm font-medium">
                    Configurar link da entrevista para a etapa atual ({currentStage.name})
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="iv_url">URL</Label>
                      <Input
                        id="iv_url"
                        type="url"
                        placeholder="https://meet.example.com/abc"
                        value={interviewUrl}
                        onChange={(e) => setInterviewUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="iv_when">Agendada para (opcional)</Label>
                      <Input
                        id="iv_when"
                        type="datetime-local"
                        value={interviewScheduledAt}
                        onChange={(e) => setInterviewScheduledAt(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={interviewUrl.trim().length === 0 || interviewMut.isPending}
                    onClick={() => interviewMut.mutate(currentStage.id)}
                  >
                    Salvar link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border shadow-[0_10px_30px_oklch(18%_0.008_60/0.04)]">
            <CardHeader>
              <CardTitle className="font-display text-lg">Status geral</CardTitle>
              <CardDescription>
                Transições de status entre `APPLIED`, `IN_PROGRESS`, `HIRED`, `REJECTED` e
                `WITHDRAWN`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {next.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este processo já está fechado na ferramenta.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {next.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant="outline"
                      disabled={moveMut.isPending}
                      onClick={() => moveMut.mutate({ status: s })}
                    >
                      Para {applicationStatusLabel(s)}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </WorkbenchPageShell>
  )
}

const STAGE_NONE = '__none__'

function StageTargetSelect({
  stages,
  value,
  onChange,
  onMove,
  moving,
}: Readonly<{
  stages: ReadonlyArray<{ id: string; name: string }>
  value: string
  onChange: (next: string) => void
  onMove: () => void
  moving: boolean
}>) {
  const selectValue = value.trim() ? value : STAGE_NONE
  const items = useMemo(() => {
    const rec: Record<string, ReactNode> = {
      [STAGE_NONE]: 'Escolher etapa…',
    }
    for (const s of stages) {
      rec[s.id] = s.name
    }
    return rec
  }, [stages])

  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
      <Select
        value={selectValue}
        items={items}
        onValueChange={(v) => onChange(v == null || v === STAGE_NONE ? '' : v)}
      >
        <SelectTrigger id="target_stage" size="default" className="h-10 w-full min-w-0 rounded-xl">
          <SelectValue placeholder="Escolher etapa…" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value={STAGE_NONE}>Escolher etapa…</SelectItem>
          {stages.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        disabled={!value || moving}
        className="min-h-11 rounded-xl"
        onClick={onMove}
      >
        Mover para a etapa
      </Button>
    </div>
  )
}
