'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { StageConfigEditor } from '@/components/pipeline/stage-config-editor'
import { StageKindBadge } from '@/components/pipeline/stage-kind-badge'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiRequestError } from '@/lib/api/client'
import { getTenantJob } from '@/lib/api/jobs-api'
import { listJobStages, replaceJobStages } from '@/lib/api/pipelines-api'
import type { PipelineStageInput, PipelineStageKind } from '@/lib/api/types'
import { isUuid } from '@/lib/is-uuid'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

interface DraftStage extends PipelineStageInput {
  draftId: string
}

function newDraft(kind: PipelineStageKind = 'MANUAL'): DraftStage {
  return {
    draftId: crypto.randomUUID(),
    kind,
    name: '',
    config: {},
    required: true,
  }
}

export default function JobStagesPage() {
  const params = useParams<{ jobId: string }>()
  const jobId = params?.jobId ?? ''
  const valid = isUuid(jobId.trim())
  const router = useRouter()
  const queryClient = useQueryClient()
  const { claims, hydrated } = useAuth()
  const [drafts, setDrafts] = useState<DraftStage[]>([])

  useEffect(() => {
    if (!hydrated) return
    if (!claims) {
      router.replace('/entrar')
      return
    }
    if (claims.role !== 'TENANT_ADMIN' && claims.role !== 'RECRUITER') {
      router.replace(homePathForRole(claims.role))
    }
  }, [hydrated, claims, router])

  const jobQ = useQuery({
    enabled: !!claims && valid,
    queryKey: ['tenant-job', claims?.sub, jobId],
    queryFn: () => getTenantJob(jobId.trim()),
  })

  const stagesQ = useQuery({
    enabled: !!claims && valid,
    queryKey: ['job-stages', claims?.sub, jobId],
    queryFn: () => listJobStages(jobId.trim()),
  })

  useEffect(() => {
    if (!stagesQ.data) return
    setDrafts(
      stagesQ.data.map((s) => ({
        draftId: s.id,
        kind: s.kind,
        name: s.name,
        config: s.config,
        required: s.required,
      })),
    )
  }, [stagesQ.data])

  const replaceMut = useMutation({
    mutationFn: (stages: PipelineStageInput[]) => replaceJobStages(jobId.trim(), stages),
    onSuccess: (data) => {
      queryClient.setQueryData(['job-stages', claims?.sub, jobId], data)
      toast.success('Etapas guardadas.')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível guardar as etapas.')
    },
  })

  const job = jobQ.data
  const isDraft = job?.status === 'DRAFT'
  const readOnly = !isDraft

  const move = (idx: number, direction: -1 | 1) => {
    setDrafts((prev) => {
      const next = [...prev]
      const target = idx + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 lg:p-8">
      <Button variant="outline" size="sm" className="w-fit gap-1" asChild>
        <Link href={`/empresa/vagas/${jobId}`}>
          <ArrowLeft className="size-4" />
          Voltar à vaga
        </Link>
      </Button>

      {!valid && (
        <Alert variant="destructive">
          <AlertDescription>Identificação inválida.</AlertDescription>
        </Alert>
      )}

      {jobQ.isLoading || stagesQ.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        job && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">Etapas: {job.title}</h1>
              <JobStatusBadge status={job.status} />
            </div>
            {!isDraft && (
              <Alert>
                <AlertDescription>
                  As etapas só podem ser reescritas enquanto a vaga estiver em DRAFT, para preservar
                  o contrato com candidatos já em curso.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-4">
              {drafts.map((stage, idx) => (
                <Card key={stage.draftId}>
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">Etapa {idx + 1}</CardTitle>
                        <StageKindBadge kind={stage.kind} />
                      </div>
                      <CardDescription>Ordem em que o candidato a percorre.</CardDescription>
                    </div>
                    {!readOnly && (
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          disabled={idx === 0}
                          onClick={() => move(idx, -1)}
                          aria-label="Mover acima"
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          disabled={idx === drafts.length - 1}
                          onClick={() => move(idx, 1)}
                          aria-label="Mover abaixo"
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() =>
                            setDrafts((prev) => prev.filter((s) => s.draftId !== stage.draftId))
                          }
                          aria-label="Remover etapa"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
                      <div className="space-y-2">
                        <Label htmlFor={`name_${stage.draftId}`}>Nome</Label>
                        <Input
                          id={`name_${stage.draftId}`}
                          value={stage.name}
                          disabled={readOnly}
                          onChange={(e) =>
                            setDrafts((prev) =>
                              prev.map((s) =>
                                s.draftId === stage.draftId ? { ...s, name: e.target.value } : s,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`kind_${stage.draftId}`}>Tipo</Label>
                        <select
                          id={`kind_${stage.draftId}`}
                          value={stage.kind}
                          disabled={readOnly}
                          onChange={(e) =>
                            setDrafts((prev) =>
                              prev.map((s) =>
                                s.draftId === stage.draftId
                                  ? {
                                      ...s,
                                      kind: e.target.value as PipelineStageKind,
                                      config: {},
                                    }
                                  : s,
                              ),
                            )
                          }
                          className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                        >
                          <option value="MANUAL">Manual</option>
                          <option value="QUESTIONNAIRE">Questionário</option>
                          <option value="INTERVIEW_LINK">Entrevista</option>
                          <option value="FILE_UPLOAD">Envio de arquivo</option>
                        </select>
                      </div>
                    </div>
                    <StageConfigEditor
                      kind={stage.kind}
                      config={stage.config ?? {}}
                      disabled={readOnly}
                      onChange={(config) =>
                        setDrafts((prev) =>
                          prev.map((s) => (s.draftId === stage.draftId ? { ...s, config } : s)),
                        )
                      }
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {!readOnly && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setDrafts((prev) => [...prev, newDraft()])}
                  className="gap-2"
                >
                  <Plus className="size-4" /> Nova etapa
                </Button>
                <Button
                  type="button"
                  className="gap-2"
                  disabled={replaceMut.isPending || drafts.length === 0}
                  onClick={() =>
                    replaceMut.mutate(
                      drafts.map(({ kind, name, config, required }) => ({
                        kind,
                        name: name.trim(),
                        config,
                        required,
                      })),
                    )
                  }
                >
                  <Save className="size-4" />
                  Guardar etapas
                </Button>
              </div>
            )}
          </>
        )
      )}
    </main>
  )
}
