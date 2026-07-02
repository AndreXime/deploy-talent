'use client'

import { useQuery } from '@tanstack/react-query'
import { Bookmark, ChevronRight, MapPin, MonitorSmartphone } from 'lucide-react'
import Link from 'next/link'
import { PageHead } from '@/components/page-head'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkbenchPageShell } from '@/components/workbench-page-shell'
import { listMySavedJobs } from '@/lib/api/candidates-api'
import { useAuth } from '@/providers/auth-provider'

export default function SavedJobsPage() {
  const { claims, hydrated } = useAuth()
  const isCandidate = claims?.role === 'CANDIDATE'

  const listQ = useQuery({
    enabled: hydrated && !!claims && isCandidate,
    queryKey: ['my-saved-jobs', claims?.sub],
    queryFn: () => listMySavedJobs({ page: 1, limit: 50 }),
  })

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        A carregar…
      </div>
    )
  }

  if (!claims || !isCandidate) {
    return (
      <WorkbenchPageShell className="max-w-2xl">
        <Alert>
          <AlertDescription>Entre como candidato para ver as vagas que salvou.</AlertDescription>
        </Alert>
        <Button asChild className="min-h-11 rounded-full">
          <Link href="/entrar?redirect=/candidato/salvas">Entrar</Link>
        </Button>
      </WorkbenchPageShell>
    )
  }

  return (
    <WorkbenchPageShell className="max-w-3xl">
      <PageHead
        title="Vagas salvas"
        description="Referências que marcou para rever ou candidatar-se mais tarde."
      />

      {listQ.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {listQ.isError ? (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível carregar a lista. Tente novamente.</AlertDescription>
        </Alert>
      ) : null}

      {listQ.data && listQ.data.items.length === 0 ? (
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Bookmark className="size-5 text-muted-foreground" aria-hidden />
              Ainda não salvou vagas
            </CardTitle>
            <CardDescription>
              Em qualquer vaga pública, use “Guardar vaga” para a encontrar aqui.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="min-h-11 rounded-full">
              <Link href="/vagas">Explorar vagas</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <ul className="flex flex-col gap-3">
        {listQ.data?.items.map(({ job, tenant, savedAt }) => (
          <li key={`${job.id}-${savedAt}`}>
            <Card className="hover-lift border-border shadow-none">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase text-muted-foreground">{tenant.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-medium">{job.title}</h2>
                    <JobStatusBadge status={job.status} audience="public" />
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MonitorSmartphone className="size-4" aria-hidden />
                      {job.modality}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-4" aria-hidden />
                      {job.location}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Salva em {new Date(savedAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  asChild
                  className="min-h-11 shrink-0 gap-2 self-stretch rounded-full sm:self-center"
                >
                  <Link href={`/carreiras/${job.tenantId}/vagas/${job.id}`}>
                    Abrir
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </WorkbenchPageShell>
  )
}
