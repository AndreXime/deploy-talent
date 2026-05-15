'use client'

import { useQuery } from '@tanstack/react-query'
import { Bookmark, ChevronRight, MapPin, MonitorSmartphone } from 'lucide-react'
import Link from 'next/link'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 lg:px-6">
        <Alert>
          <AlertDescription>
            Inicie sessão como candidato para ver as vagas que guardou.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/entrar?redirect=/candidato/guardadas">Entrar</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 lg:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Vagas guardadas</h1>
        <p className="text-sm text-muted-foreground">
          Referências que marcou para rever ou candidatar-se mais tarde.
        </p>
      </div>

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bookmark className="size-5 text-muted-foreground" aria-hidden />
              Ainda não guardou vagas
            </CardTitle>
            <CardDescription>
              Em qualquer vaga pública, use “Guardar vaga” para a encontrar aqui.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/vagas">Explorar vagas</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <ul className="flex flex-col gap-3">
        {listQ.data?.items.map(({ job, tenant, savedAt }) => (
          <li key={`${job.id}-${savedAt}`}>
            <Card className="shadow-sm">
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
                    Guardada em {new Date(savedAt).toLocaleString()}
                  </p>
                </div>
                <Button asChild className="shrink-0 gap-2 self-stretch sm:self-center">
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
    </main>
  )
}
