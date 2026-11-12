'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Bookmark, Briefcase, Building2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { listMarketplaceJobs } from '@/lib/api/jobs-api'
import type { JobResponse } from '@/lib/api/types'

const FEATURED_LIMIT = 3

const skeletonPlaceholders = ['featured-a', 'featured-b', 'featured-c'] as const

const TECH_TOKENS = [
  'TypeScript',
  'JavaScript',
  'React',
  'Node',
  'Python',
  'SQL',
  'AWS',
  'Azure',
  'GCP',
  'Docker',
  'Kubernetes',
  'Terraform',
  'Go',
  'Rust',
  'Java',
  'Kotlin',
  'Swift',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'GraphQL',
  'Next.js',
  'Vue',
  'Angular',
  'Power BI',
  'Excel',
  'HTML',
  'CSS',
] as const

function tagsFromJob(job: JobResponse): string[] {
  const haystack = `${job.title} ${job.description}`
  const found = TECH_TOKENS.filter((token) =>
    new RegExp(`\\b${token.replace('.', '\\.')}\\b`, 'i').test(haystack),
  )
  return found.slice(0, 4)
}

export function HomeFeaturedJobs() {
  const jobsQ = useQuery({
    queryKey: ['home-featured-jobs'],
    queryFn: () => listMarketplaceJobs({ page: 1, limit: FEATURED_LIMIT }),
  })

  return (
    <section
      id="vagas-destaque"
      className="relative scroll-mt-28 overflow-hidden border-y border-border bg-muted/30 py-16 lg:py-24"
    >
      <div
        className="pointer-events-none absolute -top-16 -left-10 size-56 rounded-full bg-primary/8 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 -bottom-20 size-64 rounded-full bg-primary/6 blur-3xl"
        aria-hidden
      />

      <div className="page-container relative">
        <div className="max-w-2xl">
          <h2 className="text-balance font-display text-(length:--text-display-s) font-semibold tracking-tight">
            Vagas de tecnologia em destaque
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Oportunidades em destaque para profissionais de TI.
          </p>
        </div>

        {jobsQ.isLoading ? (
          <ul className="mt-10 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {skeletonPlaceholders.map((id) => (
              <li key={id} className="min-w-0">
                <Skeleton className="h-56 w-full rounded-2xl" />
              </li>
            ))}
          </ul>
        ) : null}

        {jobsQ.isError ? (
          <Alert variant="destructive" className="mt-10">
            <AlertDescription>
              Não foi possível carregar as vagas.{' '}
              <Link href="/vagas" className="font-medium underline underline-offset-4">
                Abrir lista de vagas
              </Link>
              .
            </AlertDescription>
          </Alert>
        ) : null}

        {jobsQ.data && jobsQ.data.items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8">
            <p className="font-display text-base font-semibold">Ainda sem vagas públicas</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Quando existirem posições publicadas, aparecem aqui automaticamente.
            </p>
            <Button variant="secondary" className="mt-6 min-h-11" asChild>
              <Link href="/vagas">Ver todas as vagas</Link>
            </Button>
          </div>
        ) : null}

        {jobsQ.data && jobsQ.data.items.length > 0 ? (
          <>
            <ul className="mt-10 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3">
              {jobsQ.data.items.map(({ job, tenant }) => {
                const tags = tagsFromJob(job)
                const href = `/carreiras/${job.tenantId}/vagas/${job.id}`

                return (
                  <li key={job.id} className="min-w-0">
                    <article className="hover-lift flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-[0_10px_30px_oklch(18%_0.008_60/0.05)]">
                      <h3 className="min-w-0 font-display text-lg font-semibold leading-snug tracking-tight">
                        <Link href={href} className="hover:text-primary">
                          {job.title}
                        </Link>
                      </h3>

                      <p className="mt-4 inline-flex min-w-0 items-center gap-2.5 text-sm">
                        <Building2
                          className="size-4 shrink-0 text-primary"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <Link
                          href={`/carreiras/${tenant.id}`}
                          className="truncate font-medium text-foreground hover:text-primary"
                        >
                          {tenant.name}
                        </Link>
                      </p>

                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="inline-flex items-center gap-2.5 text-foreground">
                          <MapPin
                            className="size-4 shrink-0 text-primary"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          {job.location}
                        </span>
                        <span className="font-medium text-primary">{job.modality}</span>
                      </p>

                      {job.seniority.trim() ? (
                        <p className="mt-2 inline-flex min-w-0 items-center gap-2.5 text-sm text-foreground">
                          <Briefcase
                            className="size-4 shrink-0 text-primary"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          {job.seniority}
                        </p>
                      ) : null}

                      {tags.length > 0 ? (
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <li
                              key={`${job.id}-${tag}`}
                              className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      <div className="mt-auto flex items-center justify-between pt-6">
                        <Link
                          href={href}
                          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          Ver vaga
                          <ArrowRight className="size-3.5" aria-hidden />
                        </Link>
                        <Link
                          href={href}
                          className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                          aria-label={`Abrir ${job.title}`}
                        >
                          <Bookmark className="size-4" aria-hidden />
                        </Link>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>

            <Link
              href="/vagas"
              className="mt-8 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Ver todas as vagas
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </>
        ) : null}
      </div>
    </section>
  )
}
