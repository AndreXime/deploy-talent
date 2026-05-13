import type { LucideIcon } from 'lucide-react'
import { ClipboardList, FileText, UserCheck, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { PipelineStageKind } from '@/lib/api/types'

const META: Record<PipelineStageKind, { label: string; icon: LucideIcon }> = {
  MANUAL: { label: 'Manual', icon: UserCheck },
  QUESTIONNAIRE: { label: 'Questionário', icon: ClipboardList },
  INTERVIEW_LINK: { label: 'Entrevista', icon: Video },
  FILE_UPLOAD: { label: 'Arquivo', icon: FileText },
}

export function StageKindBadge({ kind }: { kind: PipelineStageKind }) {
  const { label, icon: Icon } = META[kind]
  return (
    <Badge variant="secondary" className="gap-1.5">
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  )
}

export function stageKindLabel(kind: PipelineStageKind): string {
  return META[kind].label
}
