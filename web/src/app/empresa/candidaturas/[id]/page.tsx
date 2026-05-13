'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { StageProgressTimeline } from '@/components/pipeline/stage-progress-timeline'
import { ApplicationStatusBadge } from '@/components/status-badge'
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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  createEvaluation,
  getTenantApplication,
  listEvaluations,
  moveApplication,
} from '@/lib/api/applications-api'
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
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'

export default function TenantApplicationDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id?.trim() ?? ''
  const { token } = useAuth()
  const qc = useQueryClient()
  const valid = isUuid(id)

  const [evalScore, setEvalScore] = useState('')
  const [evalNotes, setEvalNotes] = useState('')
  const [targetStageId, setTargetStageId] = useState('')

  const appQ = useQuery({
    enabled: !!token && valid,
    queryKey: ['tenant-application', token, id],
    queryFn: () => getTenantApplication(requireSessionToken(token), id),
  })

  const evalQ = useQuery({
    enabled: !!token && valid,
    queryKey: ['evaluations', token, id],
    queryFn: () => listEvaluations(requireSessionToken(token), id),
  })

  const jobId = appQ.data?.jobId

  const stagesQ = useQuery({
    enabled: !!token && !!jobId,
    queryKey: ['job-stages', token, jobId],
    queryFn: () => listJobStages(requireSessionToken(token), jobId as string),
  })

  const progressQ = useQuery({
    enabled: !!token && valid,
    queryKey: ['application-progress', token, id],
    queryFn: () => listApplicationProgress(requireSessionToken(token), id),
  })

  const moveMut = useMutation({
    mutationFn: (input: { status: ApiApplicationStatus }) =>
      moveApplication(requireSessionToken(token), id, input),
    onSuccess: () => {
      toast.success('Funil actualizado.')
      qc.invalidateQueries({ queryKey: ['tenant-application', token, id] })
      qc.invalidateQueries({ queryKey: ['tenant-applications', token] })
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Transição inválida.')
    },
  })

  const moveStageMut = useMutation({
    mutationFn: (jobStageId: string) =>
      moveApplicationStage(requireSessionToken(token), id, jobStageId),
    onSuccess: () => {
      toast.success('Etapa actualizada.')
      qc.invalidateQueries({ queryKey: ['tenant-application', token, id] })
      qc.invalidateQueries({ queryKey: ['application-progress', token, id] })
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
      setStageInterviewLink(requireSessionToken(token), id, jobStageId, {
        url: interviewUrl.trim(),
        scheduledAt:
          interviewScheduledAt.trim().length > 0
            ? new Date(interviewScheduledAt).toISOString()
            : undefined,
      }),
    onSuccess: () => {
      toast.success('Link de entrevista actualizado.')
      qc.invalidateQueries({ queryKey: ['application-progress', token, id] })
      setInterviewUrl('')
      setInterviewScheduledAt('')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível guardar o link.')
    },
  })

  const evalMut = useMutation({
    mutationFn: () => {
      let score: number | undefined
      if (evalScore.trim().length > 0) {
        score = Number.parseInt(evalScore, 10)
        if (Number.isNaN(score) || score < 1 || score > 5) {
          throw new Error('Pontuação deve estar entre 1 e 5.')
        }
      }
      return createEvaluation(requireSessionToken(token), {
        applicationId: id,
        score,
        notes: evalNotes.trim() || undefined,
      })
    },
    onSuccess: () => {
      toast.success('Nota interna registada.')
      setEvalScore('')
      setEvalNotes('')
      qc.invalidateQueries({ queryKey: ['evaluations', token, id] })
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message.startsWith('Pontuação')) toast.error(err.message)
      else if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível guardar a avaliação.')
    },
  })

  const row = appQ.data
  const next = row ? nextApplicationStatuses(row.status) : []
  const currentStage = row?.currentJobStageId
    ? (stagesQ.data ?? []).find((s) => s.id === row.currentJobStageId)
    : undefined

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-4 lg:p-8">
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
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{row.candidate.name}</h1>
            <ApplicationStatusBadge status={row.status} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados do candidato</CardTitle>
              <CardDescription>Visíveis apenas à equipa de recrutamento.</CardDescription>
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
                    Abrir ficheiro
                  </a>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vaga associada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{row.job.title}</p>
              <p className="text-muted-foreground">
                {row.job.modality} · {row.job.location}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Etapas da pipeline</CardTitle>
              <CardDescription>
                Mover a candidatura para outra etapa. O candidato vê a etapa actual no portal.
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
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <select
                      id="target_stage"
                      value={targetStageId}
                      onChange={(e) => setTargetStageId(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Escolher etapa…</option>
                      {(stagesQ.data ?? []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      disabled={!targetStageId || moveStageMut.isPending}
                      onClick={() => moveStageMut.mutate(targetStageId)}
                    >
                      Mover para a etapa
                    </Button>
                  </div>
                )}

              {currentStage?.kind === 'INTERVIEW_LINK' && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm font-medium">
                    Configurar link da entrevista para a etapa actual ({currentStage.name})
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
                    Guardar link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado macro</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avaliações internas</CardTitle>
              <CardDescription>Não são partilhadas com o candidato.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {evalQ.isLoading && <Skeleton className="h-12 w-full" />}
              <ul className="space-y-3">
                {evalQ.data?.map((ev) => (
                  <li key={ev.id} className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">
                      {ev.score !== null && ev.score !== undefined
                        ? `Pontuação ${ev.score}/5`
                        : 'Sem pontuação'}
                    </p>
                    {ev.notes && (
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{ev.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
              <Separator />
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="es">Pontuação (1–5, opcional)</Label>
                  <Input
                    id="es"
                    type="number"
                    min={1}
                    max={5}
                    value={evalScore}
                    onChange={(e) => setEvalScore(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="en">Notas</Label>
                  <Textarea
                    id="en"
                    rows={4}
                    value={evalNotes}
                    onChange={(e) => setEvalNotes(e.target.value)}
                    className="resize-y"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t">
              <Button type="button" disabled={evalMut.isPending} onClick={() => evalMut.mutate()}>
                Adicionar avaliação
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </main>
  )
}
