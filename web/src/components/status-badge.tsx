import { Badge } from '@/components/ui/badge'
import type { ApiApplicationStatus, ApiJobStatus } from '@/lib/api/types'
import { applicationStatusLabel, jobStatusLabel } from '@/lib/domain-labels'

export function JobStatusBadge({ status }: Readonly<{ status: ApiJobStatus }>) {
  const outline =
    status === 'CLOSED'
      ? 'border-transparent bg-muted text-muted-foreground'
      : status === 'PUBLISHED'
        ? 'border-transparent bg-primary text-primary-foreground'
        : status === 'PAUSED'
          ? 'border-transparent bg-amber-500/90 text-white'
          : 'border-transparent bg-secondary text-secondary-foreground'

  return <Badge className={outline}>{jobStatusLabel(status)}</Badge>
}

export function ApplicationStatusBadge({ status }: Readonly<{ status: ApiApplicationStatus }>) {
  let cls = 'border-transparent bg-muted text-muted-foreground'
  if (status === 'IN_PROGRESS') {
    cls = 'border-transparent bg-primary/90 text-primary-foreground'
  } else if (status === 'HIRED') {
    cls = 'border-transparent bg-emerald-600 text-white'
  } else if (status === 'REJECTED' || status === 'WITHDRAWN') {
    cls = 'border-transparent bg-destructive/85 text-white'
  } else if (status === 'APPLIED') {
    cls = 'border-transparent bg-sky-600 text-white'
  } else if (status === 'SOURCED') {
    cls = 'border-transparent bg-violet-600 text-white'
  }

  return <Badge className={cls}>{applicationStatusLabel(status)}</Badge>
}
