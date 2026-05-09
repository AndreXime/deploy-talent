'use client'

import { useQuery } from '@tanstack/react-query'
import { Briefcase, ChevronRight, MapPin, MonitorSmartphone } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { PublicHeader } from '@/components/public-header'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { listMarketplaceJobs } from '@/lib/api/jobs-api'
import { getApiBaseUrl } from '@/lib/env'
import { isUuid } from '@/lib/is-uuid'

function pickString(v: string | null): string | undefined {
  const t = v?.trim()
  return t ? t : undefined
}

export function ExploreJobsClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const noApi = !getApiBaseUrl()

  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const q = pickString(searchParams.get('q'))
  const modality = pickString(searchParams.get('modality'))
  const location = pickString(searchParams.get('location'))
  const seniority = pickString(searchParams.get('seniority'))
  const tenantId = pickString(searchParams.get('tenantId'))
  const tenantIdValid = tenantId ? isUuid(tenantId) : true

  const [draftQ, setDraftQ] = useState(searchParams.get('q') ?? '')
  const [draftModality, setDraftModality] = useState(searchParams.get('modality') ?? '')
  const [draftLocation, setDraftLocation] = useState(searchParams.get('location') ?? '')
  const [draftSeniority, setDraftSeniority] = useState(searchParams.get('seniority') ?? '')
  const [draftTenantId, setDraftTenantId] = useState(searchParams.get('tenantId') ?? '')

  useEffect(() => {
    setDraftQ(searchParams.get('q') ?? '')
    setDraftModality(searchParams.get('modality') ?? '')
    setDraftLocation(searchParams.get('location') ?? '')
    setDraftSeniority(searchParams.get('seniority') ?? '')
    setDraftTenantId(searchParams.get('tenantId') ?? '')
  }, [searchParams])

  const applyFilters = useCallback(() => {
    const p = new URLSearchParams()
    if (draftQ.trim()) p.set('q', draftQ.trim())
    if (draftModality.trim()) p.set('modality', draftModality.trim())
    if (draftLocation.trim()) p.set('location', draftLocation.trim())
    if (draftSeniority.trim()) p.set('seniority', draftSeniority.trim())
    if (draftTenantId.trim()) p.set('tenantId', draftTenantId.trim())
    p.set('page', '1')
    router.replace(`${pathname}?${p.toString()}`)
  }, [draftLocation, draftModality, draftQ, draftSeniority, draftTenantId, pathname, router])

  const jobsQ = useQuery({
    enabled: !noApi && tenantIdValid,
    queryKey: ['marketplace-jobs', page, q, modality, location, seniority, tenantId],
    queryFn: () =>
      listMarketplaceJobs({
        page,
        limit: 20,
        q,
        modality,
        location,
        seniority,
        tenantId: tenantIdValid ? tenantId : undefined,
      }),
  })

  const totalPages = jobsQ.data ? Math.max(1, Math.ceil(jobsQ.data.total / jobsQ.data.limit)) : 1

  function goPage(next: number) {
    const p = new URLSearchParams(searchParams.toString())
    p.set('page', String(next))
    router.replace(`${pathname}?${p.toString()}`)
  }

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 lg:px-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Explorar vagas</h1>
          <p className="text-sm text-muted-foreground">
            Oportunidades publicadas por empresas activas na plataforma.
          </p>
        </div>

        {noApi && (
          <Alert variant="destructive">
            <AlertDescription>
              Defina <code>NEXT_PUBLIC_API_BASE_URL</code>.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
            <CardDescription>
              Texto livre e campos opcionais; modalidade e senioridade em texto.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ex-q">Palavras-chave (título ou descripção)</Label>
              <Input
                id="ex-q"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Ex.: React, gestão de produto…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-mod">Modalidade</Label>
              <Input
                id="ex-mod"
                value={draftModality}
                onChange={(e) => setDraftModality(e.target.value)}
                placeholder="Ex.: remoto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-loc">Local</Label>
              <Input
                id="ex-loc"
                value={draftLocation}
                onChange={(e) => setDraftLocation(e.target.value)}
                placeholder="Ex.: Lisboa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-sen">Senioridade</Label>
              <Input
                id="ex-sen"
                value={draftSeniority}
                onChange={(e) => setDraftSeniority(e.target.value)}
                placeholder="Ex.: Mid"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-tid">ID da empresa (opcional)</Label>
              <Input
                id="ex-tid"
                value={draftTenantId}
                onChange={(e) => setDraftTenantId(e.target.value)}
                placeholder="UUID do tenant"
                spellCheck={false}
              />
            </div>
            <div className="flex items-end sm:col-span-2">
              <Button type="button" className="w-full sm:w-auto" onClick={applyFilters}>
                Aplicar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {!tenantIdValid && tenantId ? (
          <Alert variant="destructive">
            <AlertDescription>
              O ID da empresa não é um UUID válido; remova-o ou corrija o filtro.
            </AlertDescription>
          </Alert>
        ) : null}

        {jobsQ.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}

        {jobsQ.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível carregar as vagas. Tente mais tarde.
            </AlertDescription>
          </Alert>
        ) : null}

        {jobsQ.data && jobsQ.data.items.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="size-5 text-muted-foreground" aria-hidden />
                Nenhuma vaga encontrada
              </CardTitle>
              <CardDescription>Alargue os filtros ou volte mais tarde.</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <ul className="flex flex-col gap-3">
          {jobsQ.data?.items.map(({ job, tenant }) => (
            <li key={job.id}>
              <Card className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <Link
                      href={`/carreiras/${tenant.id}`}
                      className="text-xs font-medium uppercase tracking-wide text-primary hover:underline"
                    >
                      {tenant.name}
                    </Link>
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
                    <Link href={`/carreiras/${job.tenantId}/vagas/${job.id}`}>
                      Ver detalhes
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        {jobsQ.data && totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goPage(page - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goPage(page + 1)}
            >
              Seguinte
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  )
}
