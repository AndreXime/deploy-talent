'use client'

import { useQuery } from '@tanstack/react-query'
import { Briefcase, ChevronRight, MapPin, MonitorSmartphone } from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { PageHead } from '@/components/page-head'
import { PublicHeader } from '@/components/public-header'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { listPublicJobsForTenant } from '@/lib/api/jobs-api'
import { getPublicBranding } from '@/lib/api/tenants-api'
import { isUuid } from '@/lib/is-uuid'

function pickString(v: string | null): string | undefined {
  const t = v?.trim()
  return t ? t : undefined
}

function CareerListInner({ tenantId, valid }: { tenantId: string; valid: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const q = pickString(searchParams.get('q'))
  const modality = pickString(searchParams.get('modality'))
  const location = pickString(searchParams.get('location'))
  const seniority = pickString(searchParams.get('seniority'))

  const [draftQ, setDraftQ] = useState(searchParams.get('q') ?? '')
  const [draftModality, setDraftModality] = useState(searchParams.get('modality') ?? '')
  const [draftLocation, setDraftLocation] = useState(searchParams.get('location') ?? '')
  const [draftSeniority, setDraftSeniority] = useState(searchParams.get('seniority') ?? '')

  useEffect(() => {
    setDraftQ(searchParams.get('q') ?? '')
    setDraftModality(searchParams.get('modality') ?? '')
    setDraftLocation(searchParams.get('location') ?? '')
    setDraftSeniority(searchParams.get('seniority') ?? '')
  }, [searchParams])

  function applyFilters() {
    const p = new URLSearchParams()
    if (draftQ.trim()) p.set('q', draftQ.trim())
    if (draftModality.trim()) p.set('modality', draftModality.trim())
    if (draftLocation.trim()) p.set('location', draftLocation.trim())
    if (draftSeniority.trim()) p.set('seniority', draftSeniority.trim())
    router.replace(`${pathname}?${p.toString()}`)
  }

  const brandingQ = useQuery({
    enabled: valid,
    queryKey: ['branding-public', tenantId],
    queryFn: () => getPublicBranding(tenantId),
  })

  const jobsQ = useQuery({
    enabled: valid,
    queryKey: ['public-jobs', tenantId, q, modality, location, seniority],
    queryFn: () =>
      listPublicJobsForTenant(tenantId, {
        page: 1,
        limit: 50,
        q,
        modality,
        location,
        seniority,
      }),
  })

  return (
    <>
      {brandingQ.data?.banner?.url ? (
        <div className="relative h-44 w-full overflow-hidden border-b md:h-56 lg:h-72">
          <img src={brandingQ.data.banner.url} alt="" className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        </div>
      ) : null}
      <main className="page-container flex flex-1 flex-col gap-8 py-10 lg:py-12">
        <PageHead
          title={brandingQ.data?.name ?? 'Carreiras'}
          description="Encontre oportunidades abertas e candidate-se com seu perfil."
        >
          {brandingQ.data?.logo?.url ? (
            <img
              src={brandingQ.data.logo.url}
              alt=""
              className="size-14 rounded-lg border border-border bg-card object-contain p-1"
            />
          ) : null}
        </PageHead>

        {!valid ? (
          <Alert variant="destructive">
            <AlertDescription>
              A referência da empresa não é válida. Verifique o link que recebeu.
            </AlertDescription>
          </Alert>
        ) : null}

        {valid ? (
          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="font-display text-base">Filtrar vagas</CardTitle>
              <CardDescription>Opcional. Aplica-se à lista abaixo.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cf-q">Palavras-chave</Label>
                <Input
                  id="cf-q"
                  value={draftQ}
                  onChange={(e) => setDraftQ(e.target.value)}
                  placeholder="Título ou descripção"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-mod">Modalidade</Label>
                <Input
                  id="cf-mod"
                  value={draftModality}
                  onChange={(e) => setDraftModality(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-loc">Local</Label>
                <Input
                  id="cf-loc"
                  value={draftLocation}
                  onChange={(e) => setDraftLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-sen">Senioridade</Label>
                <Input
                  id="cf-sen"
                  value={draftSeniority}
                  onChange={(e) => setDraftSeniority(e.target.value)}
                />
              </div>
              <div className="flex items-end sm:col-span-2">
                <Button type="button" className="min-h-11 w-full lg:w-auto" onClick={applyFilters}>
                  Aplicar filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {valid && jobsQ.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}

        {valid && jobsQ.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível carregar as vagas. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        ) : null}

        {valid && jobsQ.data && jobsQ.data.items.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="size-5 text-muted-foreground" aria-hidden />
                Sem vagas que correspondam
              </CardTitle>
              <CardDescription>Alargue os filtros ou volte mais tarde.</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <ul className="flex flex-col gap-3">
          {jobsQ.data?.items.map((job) => (
            <li key={job.id} className="min-w-0">
              <Card className="hover-lift overflow-hidden border-border transition-shadow">
                <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold">{job.title}</h2>
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
                  </div>
                  <Button
                    asChild
                    className="min-h-11 shrink-0 gap-2 self-stretch rounded-full lg:self-center"
                  >
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
    </>
  )
}

function CareerListFallback() {
  return (
    <main className="page-container flex flex-1 flex-col gap-8 py-10">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-24 w-full" />
    </main>
  )
}

export default function CareerListPage() {
  const params = useParams<{ tenantId: string }>()
  const tenantId = params?.tenantId?.trim() ?? ''
  const valid = isUuid(tenantId)

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <Suspense fallback={<CareerListFallback />}>
        <CareerListInner tenantId={tenantId} valid={valid} />
      </Suspense>
    </div>
  )
}
