'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, CheckCircle2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ApiRequestError } from '@/lib/api/client'
import { presignUpload, uploadFileToPresignedUrl } from '@/lib/api/media-api'
import { getMyCurrentStage, submitCurrentStage } from '@/lib/api/pipelines-api'
import type {
  ApplicationCurrentStageResponse,
  FileUploadConfig,
  InterviewLinkConfig,
  QuestionnaireConfig,
} from '@/lib/api/types'
import {
  PIPELINE_FILE_UPLOAD_ACCEPT_ATTR,
  PIPELINE_FILE_UPLOAD_HINT,
  resolveClientPipelineUploadMimeType,
} from '@/lib/pipeline-file-upload'
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'
import { StageKindBadge } from './stage-kind-badge'

interface Props {
  applicationId: string
}

export function CandidateCurrentStageCard({ applicationId }: Props) {
  const { token } = useAuth()
  const qc = useQueryClient()

  const q = useQuery({
    enabled: !!token,
    queryKey: ['my-current-stage', token, applicationId],
    queryFn: () => getMyCurrentStage(requireSessionToken(token), applicationId),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Etapa atual</CardTitle>
        <CardDescription>
          O recrutador irá atualizar esta etapa à medida que o processo avança.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {q.isLoading && <Skeleton className="h-24 w-full" />}
        {q.isError && (
          <Alert variant="destructive">
            <AlertDescription>Não foi possível carregar a etapa atual.</AlertDescription>
          </Alert>
        )}
        {q.data && (
          <CurrentStageBody
            data={q.data}
            onSubmitted={() =>
              qc.invalidateQueries({ queryKey: ['my-current-stage', token, applicationId] })
            }
            applicationId={applicationId}
          />
        )}
      </CardContent>
    </Card>
  )
}

function CurrentStageBody({
  data,
  onSubmitted,
  applicationId,
}: {
  data: ApplicationCurrentStageResponse
  onSubmitted: () => void
  applicationId: string
}) {
  if (!data.stage) {
    return (
      <p className="text-sm text-muted-foreground">
        A empresa ainda não definiu uma etapa para esta candidatura.
      </p>
    )
  }

  const stage = data.stage
  const isCompleted = data.progress?.status === 'COMPLETED'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{stage.name}</span>
        <StageKindBadge kind={stage.kind} />
        {isCompleted && (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="size-3" /> Concluída
          </Badge>
        )}
      </div>

      {stage.kind === 'MANUAL' && (
        <p className="text-sm text-muted-foreground">
          A empresa está a avaliar esta etapa internamente. Aguarde por novidades por email.
        </p>
      )}

      {stage.kind === 'INTERVIEW_LINK' && (
        <InterviewLinkView config={stage.config} submission={data.progress?.submittedData} />
      )}

      {stage.kind === 'QUESTIONNAIRE' && !isCompleted && (
        <QuestionnaireForm
          applicationId={applicationId}
          config={stage.config as unknown as QuestionnaireConfig}
          onSubmitted={onSubmitted}
        />
      )}

      {stage.kind === 'FILE_UPLOAD' && !isCompleted && (
        <FileUploadForm
          applicationId={applicationId}
          config={stage.config as unknown as FileUploadConfig}
          onSubmitted={onSubmitted}
        />
      )}

      {stage.kind === 'QUESTIONNAIRE' && isCompleted && (
        <p className="text-sm text-muted-foreground">Respostas enviadas. Pode aguardar feedback.</p>
      )}
      {stage.kind === 'FILE_UPLOAD' && isCompleted && (
        <p className="text-sm text-muted-foreground">Arquivo enviado com sucesso.</p>
      )}
    </div>
  )
}

function InterviewLinkView({
  config,
  submission,
}: {
  config: Record<string, unknown>
  submission: Record<string, unknown> | null | undefined
}) {
  const instructions = (config as unknown as InterviewLinkConfig).instructions
  const url = submission?.url as string | undefined
  const scheduledAt = submission?.scheduledAt as string | undefined
  return (
    <div className="space-y-2 text-sm">
      {instructions && <p className="whitespace-pre-wrap text-muted-foreground">{instructions}</p>}
      {!url ? (
        <p className="text-muted-foreground">
          O recrutador ainda não compartilhou o link da entrevista.
        </p>
      ) : (
        <div className="space-y-1">
          <p>
            <span className="text-muted-foreground">Link: </span>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {url}
            </a>
          </p>
          {scheduledAt && (
            <p className="inline-flex items-center gap-1 text-muted-foreground">
              <CalendarClock className="size-3.5" aria-hidden />
              {new Date(scheduledAt).toLocaleString('pt-PT')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function QuestionnaireForm({
  applicationId,
  config,
  onSubmitted,
}: {
  applicationId: string
  config: QuestionnaireConfig
  onSubmitted: () => void
}) {
  const { token } = useAuth()
  const initial = useMemo(
    () => Object.fromEntries(config.questions.map((q) => [q.id, ''])),
    [config.questions],
  )
  const [answers, setAnswers] = useState<Record<string, string>>(initial)

  const mut = useMutation({
    mutationFn: () => {
      const payload = {
        answers: config.questions.map((q) => ({
          questionId: q.id,
          value: answers[q.id] ?? '',
        })),
      }
      return submitCurrentStage(requireSessionToken(token), applicationId, payload)
    },
    onSuccess: () => {
      toast.success('Respostas enviadas.')
      onSubmitted()
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível enviar as respostas.')
    },
  })

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        mut.mutate()
      }}
    >
      {config.questions.map((q) => (
        <div key={q.id} className="space-y-1.5">
          <Label htmlFor={`q-${q.id}`}>
            {q.label}
            {q.required && <span className="text-destructive"> *</span>}
          </Label>
          {q.type === 'TEXT_LONG' ? (
            <Textarea
              id={`q-${q.id}`}
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              rows={4}
            />
          ) : q.type === 'SINGLE_CHOICE' ? (
            <select
              id={`q-${q.id}`}
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione…</option>
              {(q.options ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={`q-${q.id}`}
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            />
          )}
        </div>
      ))}
      <Button type="submit" disabled={mut.isPending}>
        {mut.isPending ? 'Enviando…' : 'Enviar respostas'}
      </Button>
    </form>
  )
}

function FileUploadForm({
  applicationId,
  config,
  onSubmitted,
}: {
  applicationId: string
  config: FileUploadConfig
  onSubmitted: () => void
}) {
  const { token } = useAuth()
  const [file, setFile] = useState<File | null>(null)

  const mut = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecione um arquivo primeiro.')
      const contentType = resolveClientPipelineUploadMimeType(file)
      if (!contentType) {
        throw new Error('Tipo de arquivo não suportado. Use PDF, DOCX, PNG, JPG ou TXT.')
      }
      const presign = await presignUpload(requireSessionToken(token), {
        purpose: 'APPLICATION_STAGE_FILE',
        contentType,
        fileName: file.name,
        applicationId,
      })
      await uploadFileToPresignedUrl(presign.url, file, contentType)
      return submitCurrentStage(requireSessionToken(token), applicationId, {
        fileKey: presign.key,
        fileName: file.name,
        fileSize: file.size,
        mimeType: contentType,
      })
    },
    onSuccess: () => {
      toast.success('Arquivo enviado.')
      setFile(null)
      onSubmitted()
    },
    onError: (err: unknown) => {
      if (err instanceof Error) toast.error(err.message)
      else toast.error('Não foi possível enviar o arquivo.')
    },
  })

  return (
    <div className="space-y-3">
      {config.instructions && (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{config.instructions}</p>
      )}
      <p className="text-xs text-muted-foreground">{PIPELINE_FILE_UPLOAD_HINT}</p>
      <Input
        type="file"
        accept={PIPELINE_FILE_UPLOAD_ACCEPT_ATTR}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <Button type="button" disabled={!file || mut.isPending} onClick={() => mut.mutate()}>
        {mut.isPending ? 'Enviando…' : 'Enviar arquivo'}
      </Button>
    </div>
  )
}
