'use client'

import { useQuery } from '@tanstack/react-query'
import { Briefcase, ChevronRight, MapPin, MonitorSmartphone } from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
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
import { getApiBaseUrl } from '@/lib/env'
import { isUuid } from '@/lib/is-uuid'

function pickString(v: string | null): string | undefined {
  const t = v?.trim()
  return t ? t : undefined
}

function CareerListInner({ tenantId, valid }: { tenantId: string; valid: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const noApi = !getApiBaseUrl()

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
    enabled: valid && !noApi,
    queryKey: ['branding-public', tenantId],
    queryFn: () => getPublicBranding(tenantId),
  })

  const jobsQ = useQuery({
    enabled: valid && !noApi,
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
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 lg:px-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {brandingQ.data?.logo?.url ? (
              <img
                src={brandingQ.data.logo.url}
                alt=""
                className="size-14 rounded-md border bg-card object-contain p-1"
              />
            ) : null}
            <div className="flex min-w-0 flex-col">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Vagas abertas
              </span>
              {brandingQ.data?.name ? (
                <h1 className="truncate text-2xl font-semibold tracking-tight lg:text-3xl">
                  {brandingQ.data.name}
                </h1>
              ) : (
                <Skeleton className="mt-1 h-8 w-48" />
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Encontre oportunidades abertas e candidate-se com o seu perfil.
          </p>
        </div>

        {noApi ? (
          <Alert variant="destructive">
            <AlertDescription>
              Defina <code>NEXT_PUBLIC_API_BASE_URL</code> para carregar as vagas.
            </AlertDescription>
          </Alert>
        ) : null}

        {!valid ? (
          <Alert variant="destructive">
            <AlertDescription>
              A referência da empresa não é válida. Verifique o link que recebeu.
            </AlertDescription>
          </Alert>
        ) : null}

        {valid ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filtrar vagas</CardTitle>
              <CardDescription>Opcional — aplica-se à lista abaixo.</CardDescription>
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
                <Button type="button" className="w-full sm:w-auto" onClick={applyFilters}>
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
            <li key={job.id}>
              <Card className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
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
    </>
  )
}

function CareerListFallback() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 lg:px-6">
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
