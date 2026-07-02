'use client'

import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import Link from 'next/link'
import { PageHead } from '@/components/page-head'
import { ApplicationStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkbenchPageShell } from '@/components/workbench-page-shell'
import { listMyApplications } from '@/lib/api/applications-api'
import { useAuth } from '@/providers/auth-provider'

export default function CandidateHomePage() {
  const { claims } = useAuth()

  const q = useQuery({
    enabled: !!claims,
    queryKey: ['my-applications', claims?.sub, 1],
    queryFn: () => listMyApplications({ page: 1, limit: 50 }),
  })

  return (
    <WorkbenchPageShell>
      <PageHead
        title="As minhas candidaturas"
        description="Acompanhe o estado junto das empresas onde se candidatou."
      />

      {q.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full max-w-xl" />
          <Skeleton className="h-24 w-full max-w-xl" />
        </div>
      )}

      {q.isError && (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível carregar as candidaturas.</AlertDescription>
        </Alert>
      )}

      {!q.isLoading && q.data && q.data.items.length === 0 && (
        <Card className="max-w-xl border-border shadow-none">
          <CardHeader>
            <CardTitle className="font-display text-base">Sem candidaturas ainda</CardTitle>
            <CardDescription>
              Abra uma página de carreiras por empresa para se candidatar a uma posição publicada ou
              em pausa.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <ul className="flex flex-col gap-4">
        {q.data?.items.map((item) => (
          <li key={item.id}>
            <Card className="hover-lift border-border shadow-none">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium">{item.job.title}</h2>
                    <ApplicationStatusBadge status={item.status} />
                  </div>
                  <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="size-4 shrink-0" aria-hidden />
                    {item.tenant.name}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="min-h-11 shrink-0 self-start sm:self-auto"
                >
                  <Link href={`/candidato/candidaturas/${item.id}`}>Ver candidatura</Link>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </WorkbenchPageShell>
  )
}
