import { Badge } from '@/components/ui/badge'
import type { ApiApplicationStatus, ApiJobStatus } from '@/lib/api/types'
import { applicationStatusLabel, jobStatusLabel, jobStatusPublicLabel } from '@/lib/domain-labels'

export type JobBadgeAudience = 'b2b' | 'public'

export function JobStatusBadge({
  status,
  audience = 'b2b',
}: Readonly<{ status: ApiJobStatus; audience?: JobBadgeAudience }>) {
  const outline =
    status === 'CLOSED'
      ? 'border-transparent bg-muted text-muted-foreground'
      : status === 'PUBLISHED'
        ? 'border-transparent bg-primary text-primary-foreground'
        : status === 'PAUSED'
          ? 'border-transparent bg-accent text-accent-foreground'
          : 'border-transparent bg-secondary text-secondary-foreground'

  const label = audience === 'public' ? jobStatusPublicLabel(status) : jobStatusLabel(status)
  return <Badge className={outline}>{label}</Badge>
}

export function ApplicationStatusBadge({ status }: Readonly<{ status: ApiApplicationStatus }>) {
  let cls = 'border-transparent bg-muted text-muted-foreground'
  if (status === 'IN_PROGRESS') {
    cls = 'border-transparent bg-primary/90 text-primary-foreground'
  } else if (status === 'HIRED') {
    cls = 'border-transparent bg-primary text-primary-foreground'
  } else if (status === 'REJECTED' || status === 'WITHDRAWN') {
    cls = 'border-transparent bg-destructive/85 text-white'
  } else if (status === 'APPLIED') {
    cls = 'border-transparent bg-secondary text-secondary-foreground'
  } else if (status === 'SOURCED') {
    cls = 'border-transparent bg-accent text-accent-foreground'
  }

  return <Badge className={cls}>{applicationStatusLabel(status)}</Badge>
}
