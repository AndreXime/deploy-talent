'use client'

import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import Link from 'next/link'
import { ApplicationStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { listMyApplications } from '@/lib/api/applications-api'
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'

export default function CandidateHomePage() {
  const { token } = useAuth()

  const q = useQuery({
    enabled: !!token,
    queryKey: ['my-applications', token, 1],
    queryFn: () => listMyApplications(requireSessionToken(token), { page: 1, limit: 50 }),
  })

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">As minhas candidaturas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe o estado junto das empresas onde se candidatou.
        </p>
      </div>

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
        <Card className="max-w-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sem candidaturas ainda</CardTitle>
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
            <Card className="shadow-sm">
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
                  className="shrink-0 self-start sm:self-auto"
                >
                  <Link href={`/candidato/candidaturas/${item.id}`}>Ver candidatura</Link>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  )
}
