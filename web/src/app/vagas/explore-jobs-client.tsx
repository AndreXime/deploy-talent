'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Briefcase, Building2, MapPin, Search } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { PublicHeader } from '@/components/public-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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

/** Valor sentinela interno do Select; não usar como modalidade/local na banco de dados. */
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

  function clearFilters() {
    setDraftQ('')
    setDraftModality('')
    setDraftLocation('')
    setDraftSeniority('')
    setDraftTenantId('')
    router.replace(pathname)
  }

  const hasActiveFilters = Boolean(q || modality || location || seniority || tenantId)
  const resultCount = jobsQ.data?.total

  return (
    <div className="flex min-h-full flex-col bg-background">
      <PublicHeader />
      <main className="relative flex flex-1 flex-col">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_70%_80%_at_0%_0%,var(--color-accent)/0.12,transparent_55%)]"
          aria-hidden
        />

        <div className="page-container relative flex flex-1 flex-col gap-8 py-10 lg:py-14">
          <header className="max-w-2xl">
            <h1 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Vagas de tecnologia
            </h1>
            <p className="mt-3 text-pretty text-muted-foreground">
              Oportunidades de TI publicadas por empresas. Filtre por área, nível, modalidade ou
              cidade.
            </p>
            {typeof resultCount === 'number' && !jobsQ.isLoading ? (
              <p className="mt-4 text-sm font-medium text-foreground">
                {resultCount === 0
                  ? 'Nenhuma vaga encontrada'
                  : resultCount === 1
                    ? '1 vaga encontrada'
                    : `${resultCount} vagas encontradas`}
              </p>
            ) : null}
          </header>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
            <aside className="w-full shrink-0 lg:sticky lg:top-[calc(var(--banner-height)+3.5rem)] lg:w-72 xl:w-80">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_10px_30px_oklch(18%_0.008_60/0.05)]">
                <h2 className="font-display text-base font-semibold">Filtros</h2>
                {filtersQ.isError ? (
                  <p className="mt-3 text-sm text-destructive">
                    Não foi possível carregar as listas de filtro. Você ainda pode buscar por
                    palavras-chave.
                  </p>
                ) : null}

                <div className="mt-5 grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ex-q">Buscar</Label>
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                      />
                      <Input
                        id="ex-q"
                        value={draftQ}
                        onChange={(e) => setDraftQ(e.target.value)}
                        placeholder="Ex.: desenvolvimento, dados…"
                        className="h-11 pl-10"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') applyFilters()
                        }}
                      />
                    </div>
                  </div>
                  <MarketplaceStringFacetSelect
                    id="ex-mod"
                    label="Modalidade"
                    value={draftModality}
                    onChange={setDraftModality}
                    options={modalityOptions}
                    chooseLabel="Qualquer modalidade"
                    disabled={facetSelectDisabled}
                  />
                  <MarketplaceStringFacetSelect
                    id="ex-loc"
                    label="Cidade"
                    value={draftLocation}
                    onChange={setDraftLocation}
                    options={locationOptions}
                    chooseLabel="Qualquer cidade"
                    disabled={facetSelectDisabled}
                  />
                  <MarketplaceStringFacetSelect
                    id="ex-sen"
                    label="Nível"
                    value={draftSeniority}
                    onChange={setDraftSeniority}
                    options={seniorityOptions}
                    chooseLabel="Qualquer nível"
                    disabled={facetSelectDisabled}
                  />
                  <MarketplaceTenantFacetSelect
                    id="ex-tid"
                    label="Empresa"
                    value={draftTenantId}
                    onChange={setDraftTenantId}
                    tenants={tenantOptions}
                    chooseLabel="Qualquer empresa"
                    disabled={facetSelectDisabled}
                  />
                  <Button
                    type="button"
                    className="min-h-11 w-full rounded-xl"
                    onClick={applyFilters}
                  >
                    Aplicar filtros
                  </Button>
                  {hasActiveFilters ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-11 w-full rounded-xl"
                      onClick={clearFilters}
                    >
                      Limpar filtros
                    </Button>
                  ) : null}
                </div>
              </div>
            </aside>

            <div className="min-w-0 flex-1 space-y-4">
              {!tenantIdValid && tenantId ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    A empresa selecionada não é um UUID válido. Limpe o filtro ou corrija o URL.
                  </AlertDescription>
                </Alert>
              ) : null}

              {jobsQ.isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-36 w-full rounded-2xl" />
                  <Skeleton className="h-36 w-full rounded-2xl" />
                  <Skeleton className="h-36 w-full rounded-2xl" />
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
                <div className="rounded-2xl border border-dashed border-border bg-card p-8">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <Briefcase className="size-5" aria-hidden />
                  </div>
                  <p className="mt-4 font-display text-lg font-semibold">Nenhuma vaga encontrada</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Amplie os filtros ou volte mais tarde para novas oportunidades.
                  </p>
                  {hasActiveFilters ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-6 min-h-11 rounded-xl"
                      onClick={clearFilters}
                    >
                      Limpar filtros
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <ul className="flex flex-col gap-4">
                {jobsQ.data?.items.map(({ job, tenant }) => {
                  const href = `/carreiras/${job.tenantId}/vagas/${job.id}`
                  return (
                    <li key={job.id} className="min-w-0">
                      <article className="hover-lift flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_10px_30px_oklch(18%_0.008_60/0.05)] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
                        <div className="min-w-0 flex-1">
                          <h2 className="font-display text-lg font-semibold tracking-tight">
                            <Link href={href} className="hover:text-primary">
                              {job.title}
                            </Link>
                          </h2>

                          <p className="mt-3 inline-flex min-w-0 items-center gap-2.5 text-sm">
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
                        </div>

                        <Button
                          asChild
                          className="min-h-11 shrink-0 gap-2 self-stretch rounded-xl sm:self-center"
                        >
                          <Link href={href}>
                            Ver detalhes
                            <ArrowRight className="size-4" aria-hidden />
                          </Link>
                        </Button>
                      </article>
                    </li>
                  )
                })}
              </ul>

              {jobsQ.data && totalPages > 1 ? (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 rounded-xl"
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
                    className="min-h-11 rounded-xl"
                    disabled={page >= totalPages}
                    onClick={() => goPage(page + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
