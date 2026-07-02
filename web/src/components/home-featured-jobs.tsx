'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowRight, MapPin, MonitorSmartphone } from 'lucide-react'
import Link from 'next/link'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { listMarketplaceJobs } from '@/lib/api/jobs-api'

const FEATURED_LIMIT = 3

const skeletonPlaceholders = ['featured-a', 'featured-b', 'featured-c'] as const

function snippetFromDescription(raw: string, maxLen: number): string {
  const collapsed = raw.replace(/\s+/g, ' ').trim()
  if (collapsed.length <= maxLen) {
    return collapsed
  }
  return `${collapsed.slice(0, maxLen - 1).trimEnd()}…`
}

export function HomeFeaturedJobs() {
  const jobsQ = useQuery({
    queryKey: ['home-featured-jobs'],
    queryFn: () => listMarketplaceJobs({ page: 1, limit: FEATURED_LIMIT }),
  })

  return (
    <section id="vagas-destaque" className="scroll-mt-28 py-16 lg:py-20">
      <div className="page-container">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="section-head min-w-0">
            <h2 className="text-balance text-[length:var(--text-display-s)] font-semibold tracking-tight">
              Publicadas agora
            </h2>
            <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
              As {FEATURED_LIMIT} vagas mais recentes do marketplace, o mesmo índice do explorador.
            </p>
          </div>
          <Button variant="outline" className="min-h-11 shrink-0 rounded-full" asChild>
            <Link href="/vagas" className="gap-2">
              Ver índice completo
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>

        {jobsQ.isLoading ? (
          <ul className="mt-12 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {skeletonPlaceholders.map((id) => (
              <li key={id} className="min-w-0">
                <Skeleton className="h-52 w-full rounded-xl" />
              </li>
            ))}
          </ul>
        ) : null}

        {jobsQ.isError ? (
          <Alert variant="destructive" className="mt-10">
            <AlertDescription>
              Não foi possível carregar as vagas.{' '}
              <Link href="/vagas" className="font-medium underline underline-offset-4">
                Abrir explorador
              </Link>
              .
            </AlertDescription>
          </Alert>
        ) : null}

        {jobsQ.data && jobsQ.data.items.length === 0 ? (
          <Card className="mt-10 border-dashed">
            <CardHeader>
              <CardTitle className="font-display text-base">Ainda sem vagas públicas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Quando existirem posições publicadas, aparecem aqui automaticamente.
              </p>
            </CardHeader>
            <CardFooter>
              <Button variant="secondary" className="min-h-11" asChild>
                <Link href="/vagas">Ir ao explorador</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : null}

        {jobsQ.data && jobsQ.data.items.length > 0 ? (
          <ul className="mt-12 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {jobsQ.data.items.map(({ job, tenant }) => (
              <li key={job.id} className="min-w-0">
                <Card className="hover-lift h-full border-border transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="min-w-0 pr-2 font-display text-base leading-snug">
                        {job.title}
                      </CardTitle>
                      <JobStatusBadge status={job.status} audience="public" />
                    </div>
                    <Link
                      href={`/carreiras/${tenant.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {tenant.name}
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{job.seniority}</Badge>
                      <Badge
                        variant="outline"
                        className="inline-flex items-center gap-1 font-normal"
                      >
                        <MonitorSmartphone className="size-3 shrink-0" aria-hidden />
                        {job.modality}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="inline-flex items-center gap-1 font-normal"
                      >
                        <MapPin className="size-3 shrink-0" aria-hidden />
                        {job.location}
                      </Badge>
                    </div>
                    {job.description.trim() ? (
                      <p className="line-clamp-3 text-pretty text-xs leading-relaxed text-muted-foreground">
                        {snippetFromDescription(job.description, 220)}
                      </p>
                    ) : null}
                  </CardContent>
                  <CardFooter className="border-t-0 pt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-11 w-full justify-between px-0"
                      asChild
                    >
                      <Link href={`/carreiras/${job.tenantId}/vagas/${job.id}`}>
                        Ver vaga
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
