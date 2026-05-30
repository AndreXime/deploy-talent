import { Check, Circle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type {
  ApplicationStageProgressResponse,
  PipelineStageResponse,
  QuestionnaireConfig,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { StageKindBadge } from './stage-kind-badge'

interface Props {
  stages: PipelineStageResponse[]
  progress: ApplicationStageProgressResponse[]
  currentJobStageId: string | null
}

export function StageProgressTimeline({ stages, progress, currentJobStageId }: Props) {
  if (stages.length === 0) {
    return <p className="text-sm text-muted-foreground">Esta vaga não tem etapas configuradas.</p>
  }
  const byStageId = new Map(progress.map((p) => [p.jobStageId, p]))

  return (
    <ol className="space-y-2">
      {stages.map((stage) => {
        const p = byStageId.get(stage.id)
        const isCurrent = stage.id === currentJobStageId
        const completed = p?.status === 'COMPLETED'
        return (
          <li
            key={stage.id}
            className={cn(
              'flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start',
              isCurrent && 'border-primary/60 bg-primary/5',
            )}
          >
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  #{stage.position + 1}
                </span>
                <span className="font-medium">{stage.name}</span>
                <StageKindBadge kind={stage.kind} />
                {isCurrent && (
                  <Badge variant="default" className="gap-1">
                    <Circle className="size-2.5 fill-current" /> Etapa atual
                  </Badge>
                )}
                {completed && (
                  <Badge variant="secondary" className="gap-1">
                    <Check className="size-3" /> Concluída
                  </Badge>
                )}
                {!completed && p?.status === 'PENDING' && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="size-3" /> Pendente
                  </Badge>
                )}
              </div>
              {p?.submittedData && (
                <StageSubmissionSummary
                  kind={stage.kind}
                  config={stage.config}
                  submission={p.submittedData}
                />
              )}
              {p?.completedAt && (
                <p className="text-xs text-muted-foreground">
                  Concluída em {new Date(p.completedAt).toLocaleString('pt-PT')}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function StageSubmissionSummary({
  kind,
  config,
  submission,
}: {
  kind: PipelineStageResponse['kind']
  config: Record<string, unknown>
  submission: Record<string, unknown>
}) {
  if (kind === 'QUESTIONNAIRE') {
    const questions = (config as unknown as QuestionnaireConfig).questions ?? []
    const answers = (submission.answers as Array<{ questionId: string; value: string }>) ?? []
    const byId = new Map(answers.map((a) => [a.questionId, a.value]))
    return (
      <dl className="grid gap-1 text-sm">
        {questions.map((q) => (
          <div key={q.id} className="grid grid-cols-[auto_1fr] items-baseline gap-2">
            <dt className="text-muted-foreground">{q.label}:</dt>
            <dd className="whitespace-pre-wrap">{byId.get(q.id) ?? '—'}</dd>
          </div>
        ))}
      </dl>
    )
  }
  if (kind === 'FILE_UPLOAD') {
    const fileKey = submission.fileKey as string | undefined
    return (
      <p className="text-sm text-muted-foreground">
        Arquivo enviado: <span className="font-mono">{fileKey ?? 'desconhecido'}</span>
      </p>
    )
  }
  if (kind === 'INTERVIEW_LINK') {
    const url = submission.url as string | undefined
    const scheduledAt = submission.scheduledAt as string | undefined
    return (
      <div className="text-sm">
        {url && (
          <p>
            <span className="text-muted-foreground">URL: </span>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {url}
            </a>
          </p>
        )}
        {scheduledAt && (
          <p className="text-muted-foreground">
            Agendada para {new Date(scheduledAt).toLocaleString('pt-PT')}
          </p>
        )}
      </div>
    )
  }
  return null
}
