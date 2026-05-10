'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
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
import { presignDownload } from '@/lib/api/media-api'
import type { ApiApplicationStatus } from '@/lib/api/types'
import { applicationStatusLabel } from '@/lib/domain-labels'
import { getApiBaseUrl } from '@/lib/env'
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
  const noApi = !getApiBaseUrl()

  const [stageNote, setStageNote] = useState('')
  const [evalScore, setEvalScore] = useState('')
  const [evalNotes, setEvalNotes] = useState('')

  const appQ = useQuery({
    enabled: !!token && valid && !noApi,
    queryKey: ['tenant-application', token, id],
    queryFn: () => getTenantApplication(requireSessionToken(token), id),
  })

  const evalQ = useQuery({
    enabled: !!token && valid && !noApi,
    queryKey: ['evaluations', token, id],
    queryFn: () => listEvaluations(requireSessionToken(token), id),
  })

  const moveMut = useMutation({
    mutationFn: (input: { status: ApiApplicationStatus; stage?: string }) =>
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
      {noApi && (
        <Alert variant="destructive">
          <AlertDescription>
            Defina <code>NEXT_PUBLIC_API_BASE_URL</code>.
          </AlertDescription>
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
              {row.candidate.resumeKey && (
                <p>
                  <span className="text-muted-foreground">Currículo: </span>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto min-h-0 p-0 font-medium text-primary underline-offset-4"
                    onClick={async () => {
                      const resumeKey = row.candidate.resumeKey
                      if (!token || !resumeKey) return
                      try {
                        const { url } = await presignDownload(
                          requireSessionToken(token),
                          resumeKey,
                        )
                        window.open(url, '_blank', 'noopener,noreferrer')
                      } catch (err: unknown) {
                        if (err instanceof ApiRequestError) toast.error(err.message)
                        else toast.error('Não foi possível abrir o currículo.')
                      }
                    }}
                  >
                    Abrir ficheiro
                  </Button>
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
              <CardTitle className="text-lg">Movimentar no funil</CardTitle>
              <CardDescription>
                Escolha o próximo estado macro. Pode acrescentar uma nota de etapa visível
                internamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Nota de etapa (opcional)</Label>
                <Input
                  id="stage"
                  value={stageNote}
                  onChange={(e) => setStageNote(e.target.value)}
                  maxLength={80}
                  placeholder="Ex.: Entrevista técnica agendada"
                />
              </div>
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
                      onClick={() =>
                        moveMut.mutate({
                          status: s,
                          stage: stageNote.trim() || undefined,
                        })
                      }
                    >
                      Para {applicationStatusLabel(s)}
                    </Button>
                  ))}
                </div>
              )}
              {row.status !== 'REJECTED' &&
                row.status !== 'WITHDRAWN' &&
                row.status !== 'HIRED' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    disabled={moveMut.isPending}
                    onClick={() =>
                      moveMut.mutate({
                        status: row.status,
                        stage: stageNote.trim() || undefined,
                      })
                    }
                  >
                    Gravar só a nota de etapa
                  </Button>
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
