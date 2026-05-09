'use client'

import { useQuery } from '@tanstack/react-query'
import { Briefcase, ChevronRight, MapPin, MonitorSmartphone } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PublicHeader } from '@/components/public-header'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { listPublicJobsForTenant } from '@/lib/api/jobs-api'
import { getPublicBranding } from '@/lib/api/tenants-api'
import { careersHeadline, getApiBaseUrl } from '@/lib/env'
import { isUuid } from '@/lib/is-uuid'

export default function CareerListPage() {
  const params = useParams<{ tenantId: string }>()
  const tenantId = params?.tenantId?.trim() ?? ''
  const valid = isUuid(tenantId)
  const noApi = !getApiBaseUrl()

  const brandingQ = useQuery({
    enabled: valid && !noApi,
    queryKey: ['branding-public', tenantId],
    queryFn: () => getPublicBranding(tenantId),
  })

  const jobsQ = useQuery({
    enabled: valid && !noApi,
    queryKey: ['public-jobs', tenantId],
    queryFn: () => listPublicJobsForTenant(tenantId, { page: 1, limit: 50 }),
  })

  const headline = careersHeadline()

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      {(brandingQ.data?.banner?.url ?? brandingQ.data?.logo?.url) && (
        <div className="relative h-44 w-full overflow-hidden border-b md:h-56 lg:h-72">
          {brandingQ.data.banner?.url ? (
            <img src={brandingQ.data.banner.url} alt="" className="h-full w-full object-cover" />
          ) : brandingQ.data.logo?.url ? (
            <div className="flex h-full items-center justify-center bg-muted">
              <img src={brandingQ.data.logo.url} alt="" className="max-h-24 object-contain" />
            </div>
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        </div>
      )}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 lg:px-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {brandingQ.data?.logo?.url && !brandingQ.data?.banner?.url && (
              <img
                src={brandingQ.data.logo.url}
                alt=""
                className="size-12 rounded-md border bg-card object-contain p-1"
              />
            )}
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{headline}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Encontre oportunidades abertas e candidate-se com o seu perfil.
          </p>
        </div>

        {noApi && (
          <Alert variant="destructive">
            <AlertDescription>
              Defina <code>NEXT_PUBLIC_API_BASE_URL</code> para carregar as vagas.
            </AlertDescription>
          </Alert>
        )}

        {!valid && (
          <Alert variant="destructive">
            <AlertDescription>
              A referência da empresa não é válida. Verifique o link que recebeu.
            </AlertDescription>
          </Alert>
        )}

        {valid && jobsQ.isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {valid && jobsQ.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível carregar as vagas. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        )}

        {valid && jobsQ.data && jobsQ.data.items.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="size-5 text-muted-foreground" aria-hidden />
                Sem vagas neste momento
              </CardTitle>
              <CardDescription>
                Volte mais tarde ou contacte a empresa para novas oportunidades.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <ul className="flex flex-col gap-3">
          {jobsQ.data?.items.map((job) => (
            <li key={job.id}>
              <Card className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-medium">{job.title}</h2>
                      <JobStatusBadge status={job.status} />
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
                  </div>
                  <Button asChild className="shrink-0 gap-2 self-stretch sm:self-center">
                    <Link href={`/carreiras/${tenantId}/vagas/${job.id}`}>
                      Ver detalhes
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
