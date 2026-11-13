'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PageHead } from '@/components/page-head'
import { StageConfigEditor } from '@/components/pipeline/stage-config-editor'
import { StageKindBadge } from '@/components/pipeline/stage-kind-badge'
import { StageKindSelect } from '@/components/pipeline/stage-kind-select'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkbenchPageShell } from '@/components/workbench-page-shell'
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
      toast.success('Etapas salvas.')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível salvar as etapas.')
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
    <WorkbenchPageShell className="max-w-3xl">
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
            <PageHead title={`Etapas: ${job.title}`}>
              <JobStatusBadge status={job.status} />
            </PageHead>
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
                <Card
                  key={stage.draftId}
                  className="rounded-2xl border-border shadow-[0_10px_30px_oklch(18%_0.008_60/0.04)]"
                >
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="font-display text-base">Etapa {idx + 1}</CardTitle>
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
                      <StageKindSelect
                        id={`kind_${stage.draftId}`}
                        value={stage.kind}
                        disabled={readOnly}
                        onChange={(kind) =>
                          setDrafts((prev) =>
                            prev.map((s) =>
                              s.draftId === stage.draftId ? { ...s, kind, config: {} } : s,
                            ),
                          )
                        }
                      />
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
                  className="min-h-11 gap-2 rounded-full"
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
                  Salvar etapas
                </Button>
              </div>
            )}
          </>
        )
      )}
    </WorkbenchPageShell>
  )
}
