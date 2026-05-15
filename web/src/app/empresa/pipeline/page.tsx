'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { StageConfigEditor } from '@/components/pipeline/stage-config-editor'
import { StageKindBadge } from '@/components/pipeline/stage-kind-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiRequestError } from '@/lib/api/client'
import { getTenantPipeline, replaceTenantPipeline } from '@/lib/api/pipelines-api'
import type { PipelineStageInput, PipelineStageKind } from '@/lib/api/types'
import { homePathForRole } from '@/lib/routes'
import { useAuth } from '@/providers/auth-provider'

const TEMPLATE_QUERY_KEY = ['tenant', 'current', 'pipelineTemplate'] as const

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

export default function TenantPipelinePage() {
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

  const templateQ = useQuery({
    enabled: !!claims,
    queryKey: TEMPLATE_QUERY_KEY,
    queryFn: () => getTenantPipeline(),
  })

  useEffect(() => {
    if (!templateQ.data) return
    setDrafts(
      templateQ.data.stages.map((s) => ({
        draftId: s.id,
        kind: s.kind,
        name: s.name,
        config: s.config,
        required: s.required,
      })),
    )
  }, [templateQ.data])

  const replaceMut = useMutation({
    mutationFn: (stages: PipelineStageInput[]) => replaceTenantPipeline(stages),
    onSuccess: (data) => {
      queryClient.setQueryData(TEMPLATE_QUERY_KEY, data)
      toast.success('Pipeline guardada.')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível guardar a pipeline.')
    },
  })

  const readOnly = claims?.role !== 'TENANT_ADMIN'

  const handleSubmit = () => {
    const payload: PipelineStageInput[] = drafts.map(({ kind, name, config, required }) => ({
      kind,
      name: name.trim(),
      config,
      required,
    }))
    replaceMut.mutate(payload)
  }

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
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline default</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define as etapas que cada nova vaga clona ao ser criada. Cada etapa tem um tipo que
          determina a interação do candidato.
        </p>
      </div>

      {templateQ.isError && (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível carregar a pipeline.</AlertDescription>
        </Alert>
      )}

      {templateQ.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {drafts.map((stage, idx) => (
              <Card key={stage.draftId}>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">Etapa {idx + 1}</CardTitle>
                      <StageKindBadge kind={stage.kind} />
                    </div>
                    <CardDescription>
                      Posição na pipeline; arrasta com as setas para reordenar.
                    </CardDescription>
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
                        <option value="MANUAL">Manual (só recrutador)</option>
                        <option value="QUESTIONNAIRE">Questionário</option>
                        <option value="INTERVIEW_LINK">Entrevista (link)</option>
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
                onClick={handleSubmit}
                disabled={replaceMut.isPending || drafts.length === 0}
                className="gap-2"
              >
                <Save className="size-4" />
                Guardar pipeline
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
