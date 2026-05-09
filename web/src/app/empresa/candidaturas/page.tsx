'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ApplicationStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { listTenantApplications } from '@/lib/api/applications-api'
import type { ApiApplicationStatus } from '@/lib/api/types'
import { applicationStatusLabel } from '@/lib/domain-labels'
import { getApiBaseUrl } from '@/lib/env'
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'

export default function TenantApplicationsPage() {
  const { token } = useAuth()
  const noApi = !getApiBaseUrl()
  const [status, setStatus] = useState<ApiApplicationStatus | 'ALL'>('ALL')

  const q = useQuery({
    enabled: !!token && !noApi,
    queryKey: ['tenant-applications', token, status],
    queryFn: () =>
      listTenantApplications(requireSessionToken(token), {
        page: 1,
        limit: 50,
        status: status === 'ALL' ? undefined : status,
      }),
  })

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Candidaturas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulte quem está em processo e abra o detalhe para movimentar o funil.
        </p>
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
          <label className="sr-only" htmlFor="app-filter">
            Estado
          </label>
          <select
            id="app-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as ApiApplicationStatus | 'ALL')}
            className="flex h-10 w-full max-w-[280px] rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">Todas</option>
            {(
              [
                'SOURCED',
                'APPLIED',
                'IN_PROGRESS',
                'REJECTED',
                'WITHDRAWN',
                'HIRED',
              ] as ApiApplicationStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {applicationStatusLabel(s)}
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
          <AlertDescription>Não foi possível carregar candidaturas.</AlertDescription>
        </Alert>
      )}

      <ul className="flex flex-col gap-4">
        {q.data?.items.map((row) => (
          <li key={row.id}>
            <Card className="shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{row.candidate.name}</span>
                    <ApplicationStatusBadge status={row.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {row.job.title}
                    {row.stage ? ` · ${row.stage}` : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 gap-1" asChild>
                  <Link href={`/empresa/candidaturas/${row.id}`}>
                    Abrir ficha
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {q.data && q.data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">Não há candidaturas com este filtro.</p>
      )}
    </main>
  )
}
