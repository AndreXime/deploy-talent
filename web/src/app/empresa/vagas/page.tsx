'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronRight, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { listTenantJobs } from '@/lib/api/jobs-api'
import type { ApiJobStatus } from '@/lib/api/types'
import { jobStatusLabel } from '@/lib/domain-labels'
import { getApiBaseUrl } from '@/lib/env'
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'

export default function TenantJobsPage() {
  const { token } = useAuth()
  const noApi = !getApiBaseUrl()
  const [status, setStatus] = useState<ApiJobStatus | 'ALL'>('ALL')

  const q = useQuery({
    enabled: !!token && !noApi,
    queryKey: ['tenant-jobs', token, status],
    queryFn: () =>
      listTenantJobs(requireSessionToken(token), {
        page: 1,
        limit: 50,
        status: status === 'ALL' ? undefined : status,
      }),
  })

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vagas da empresa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie, edite e controle onde cada posição está no ciclo de publicação.
          </p>
        </div>
        <Button className="shrink-0 gap-2" asChild>
          <Link href="/empresa/vagas/nova">
            <PlusCircle className="size-4" aria-hidden />
            Nova vaga
          </Link>
        </Button>
      </div>

      {noApi && (
        <Alert variant="destructive">
          <AlertDescription>
            Defina <code>NEXT_PUBLIC_API_BASE_URL</code>.
          </AlertDescription>
        </Alert>
      )}

      <Card className="max-w-xs shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Filtrar por estado</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <label className="sr-only" htmlFor="job-status-filter">
            Estado
          </label>
          <select
            id="job-status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as ApiJobStatus | 'ALL')}
            className="flex h-10 w-full max-w-[220px] rounded-lg border border-input bg-transparent px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">Todas</option>
            {(['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED'] as ApiJobStatus[]).map((s) => (
              <option key={s} value={s}>
                {jobStatusLabel(s)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {q.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}

      {q.isError && (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível carregar as vagas.</AlertDescription>
        </Alert>
      )}

      {!q.data || q.data.items.length === 0 ? null : (
        <ul className="flex flex-col gap-4">
          {q.data.items.map((job) => (
            <li key={job.id}>
              <Card className="shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-medium">{job.title}</h2>
                      <JobStatusBadge status={job.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {job.modality} · {job.location}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 gap-1" asChild>
                    <Link href={`/empresa/vagas/${job.id}`}>
                      Gerir
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {q.data && q.data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Sem vagas com este critério. Crie uma nova posição quando estiver preparado.
        </p>
      )}
    </main>
  )
}
