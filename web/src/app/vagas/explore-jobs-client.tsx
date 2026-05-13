'use client'

import { useQuery } from '@tanstack/react-query'
import { Briefcase, ChevronRight, MapPin, MonitorSmartphone } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { PublicHeader } from '@/components/public-header'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { getMarketplaceJobFilterOptions, listMarketplaceJobs } from '@/lib/api/jobs-api'
import type { MarketplaceTenantFilterOption } from '@/lib/api/types'
import { isUuid } from '@/lib/is-uuid'

function pickString(v: string | null): string | undefined {
  const t = v?.trim()
  return t ? t : undefined
}

/** Valor sentinela interno do Select; não usar como modalidade/local na base de dados. */
const MARKETPLACE_FILTER_ANY = '__dt_marketplace_any__'

function mergeDraftStringOption(options: readonly string[], draft: string): string[] {
  const t = draft.trim()
  if (!t) return [...options]
  const exists = options.some((o) => o.localeCompare(t, undefined, { sensitivity: 'accent' }) === 0)
  if (exists) return [...options]
  return [t, ...options]
}

function mergeDraftTenantOption(
  tenants: readonly MarketplaceTenantFilterOption[],
  draftId: string,
): MarketplaceTenantFilterOption[] {
  const t = draftId.trim()
  if (!t || tenants.some((x) => x.id === t)) return [...tenants]
  return [{ id: t, name: 'Empresa (não listada)' }, ...tenants]
}

interface MarketplaceStringFacetSelectProps {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
  options: readonly string[]
  /** Texto no gatilho e na opção “nenhum filtro” (Base UI `items` evita mostrar o valor cru). */
  chooseLabel: string
  disabled?: boolean
}

function MarketplaceStringFacetSelect({
  id,
  label,
  value,
  onChange,
  options,
  chooseLabel,
  disabled,
}: MarketplaceStringFacetSelectProps) {
  const selectValue = value.trim() ? value : MARKETPLACE_FILTER_ANY
  const items = useMemo(() => {
    const rec: Record<string, ReactNode> = {
      [MARKETPLACE_FILTER_ANY]: chooseLabel,
    }
    for (const opt of options) {
      rec[opt] = opt
    }
    return rec
  }, [chooseLabel, options])

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={selectValue}
        items={items}
        onValueChange={(v) => onChange(v == null || v === MARKETPLACE_FILTER_ANY ? '' : v)}
        disabled={disabled}
      >
        <SelectTrigger id={id} size="default" className="w-full min-w-0">
          <SelectValue placeholder={chooseLabel} />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value={MARKETPLACE_FILTER_ANY}>{chooseLabel}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface MarketplaceTenantFacetSelectProps {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
  tenants: readonly MarketplaceTenantFilterOption[]
  chooseLabel: string
  disabled?: boolean
}

function MarketplaceTenantFacetSelect({
  id,
  label,
  value,
  onChange,
  tenants,
  chooseLabel,
  disabled,
}: MarketplaceTenantFacetSelectProps) {
  const selectValue = value.trim() ? value : MARKETPLACE_FILTER_ANY
  const items = useMemo(() => {
    const rec: Record<string, ReactNode> = {
      [MARKETPLACE_FILTER_ANY]: chooseLabel,
    }
    for (const t of tenants) {
      rec[t.id] = t.name
    }
    return rec
  }, [chooseLabel, tenants])

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={selectValue}
        items={items}
        onValueChange={(v) => onChange(v == null || v === MARKETPLACE_FILTER_ANY ? '' : v)}
        disabled={disabled}
      >
        <SelectTrigger id={id} size="default" className="w-full min-w-0">
          <SelectValue placeholder={chooseLabel} />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value={MARKETPLACE_FILTER_ANY}>{chooseLabel}</SelectItem>
          {tenants.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function ExploreJobsClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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

  const filtersQ = useQuery({
    queryKey: ['marketplace-job-filters'],
    queryFn: getMarketplaceJobFilterOptions,
    staleTime: 5 * 60_000,
  })

  const modalityOptions = useMemo(
    () => mergeDraftStringOption(filtersQ.data?.modalities ?? [], draftModality),
    [draftModality, filtersQ.data?.modalities],
  )
  const locationOptions = useMemo(
    () => mergeDraftStringOption(filtersQ.data?.locations ?? [], draftLocation),
    [draftLocation, filtersQ.data?.locations],
  )
  const seniorityOptions = useMemo(
    () => mergeDraftStringOption(filtersQ.data?.seniorities ?? [], draftSeniority),
    [draftSeniority, filtersQ.data?.seniorities],
  )
  const tenantOptions = useMemo(
    () => mergeDraftTenantOption(filtersQ.data?.tenants ?? [], draftTenantId),
    [draftTenantId, filtersQ.data?.tenants],
  )

  const facetSelectDisabled = filtersQ.isLoading

  const jobsQ = useQuery({
    enabled: tenantIdValid,
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
            Oportunidades publicadas por empresas ativas na plataforma.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
            {filtersQ.isError ? (
              <CardDescription className="text-destructive">
                Não foi possível carregar as listas de filtro; pode usar palavras-chave e tentar de
                novo.
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ex-q">Palavras-chave</Label>
              <Input
                id="ex-q"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Ex.: React, gestão de produto…"
              />
            </div>
            <MarketplaceStringFacetSelect
              id="ex-mod"
              label="Modalidade"
              value={draftModality}
              onChange={setDraftModality}
              options={modalityOptions}
              chooseLabel="Escolha a modalidade"
              disabled={facetSelectDisabled}
            />
            <MarketplaceStringFacetSelect
              id="ex-loc"
              label="Local"
              value={draftLocation}
              onChange={setDraftLocation}
              options={locationOptions}
              chooseLabel="Escolha o local"
              disabled={facetSelectDisabled}
            />
            <MarketplaceStringFacetSelect
              id="ex-sen"
              label="Senioridade"
              value={draftSeniority}
              onChange={setDraftSeniority}
              options={seniorityOptions}
              chooseLabel="Escolha a senioridade"
              disabled={facetSelectDisabled}
            />
            <MarketplaceTenantFacetSelect
              id="ex-tid"
              label="Empresa"
              value={draftTenantId}
              onChange={setDraftTenantId}
              tenants={tenantOptions}
              chooseLabel="Escolha a empresa"
              disabled={facetSelectDisabled}
            />
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
              A empresa seleccionada não é um UUID válido; limpe o filtro ou corrija o URL.
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
