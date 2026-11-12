'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Bookmark, Briefcase, Building2, MapPin, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PublicHeader } from '@/components/public-header'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { applyToJob } from '@/lib/api/applications-api'
import { listMySavedJobs, saveJobBookmark, unsaveJob } from '@/lib/api/candidates-api'
import { ApiRequestError } from '@/lib/api/client'
import { getPublicJob } from '@/lib/api/jobs-api'
import { getPublicBranding } from '@/lib/api/tenants-api'
import { isUuid } from '@/lib/is-uuid'
import { useAuth } from '@/providers/auth-provider'

export default function PublicJobDetailPage() {
  const params = useParams<{ tenantId: string; jobId: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { claims } = useAuth()

  const tenantId = params?.tenantId?.trim() ?? ''
  const jobId = params?.jobId?.trim() ?? ''
  const validTenant = isUuid(tenantId)
  const validJob = isUuid(jobId)

  const brandingQ = useQuery({
    enabled: validTenant,
    queryKey: ['branding-public', tenantId],
    queryFn: () => getPublicBranding(tenantId),
  })

  const jobQ = useQuery({
    enabled: validTenant && validJob,
    queryKey: ['public-job', tenantId, jobId],
    queryFn: () => getPublicJob(tenantId, jobId),
  })

  const isCandidate = claims?.role === 'CANDIDATE'

  const savedIdsQ = useQuery({
    enabled: Boolean(claims) && isCandidate && validJob,
    queryKey: ['my-saved-job-ids', claims?.sub],
    queryFn: async () => {
      const res = await listMySavedJobs({ page: 1, limit: 100 })
      return new Set(res.items.map((row) => row.job.id))
    },
  })

  const isSaved = validJob && jobId ? Boolean(savedIdsQ.data?.has(jobId)) : false

  const saveMut = useMutation({
    mutationFn: () => saveJobBookmark(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-saved-job-ids', claims?.sub] })
      queryClient.invalidateQueries({ queryKey: ['my-saved-jobs', claims?.sub] })
      toast.success('Vaga salva na sua lista.')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível salvar.')
    },
  })

  const unsaveMut = useMutation({
    mutationFn: () => unsaveJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-saved-job-ids', claims?.sub] })
      queryClient.invalidateQueries({ queryKey: ['my-saved-jobs', claims?.sub] })
      toast.success('Removida das vagas salvas.')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível remover.')
    },
  })

  const applyMut = useMutation({
    mutationFn: () => {
      if (!claims) throw new Error('Sem sessão.')
      return applyToJob(tenantId, { jobId })
    },
    onSuccess: () => {
      toast.success('Candidatura enviada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['my-applications'] })
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) {
        toast.error(err.message)
      } else {
        toast.error('Não foi possível candidatar-se.')
      }
    },
  })

  const job = jobQ.data
  const companyName = brandingQ.data?.name
  const canApply =
    job && (job.status === 'PUBLISHED' || job.status === 'PAUSED') && validTenant && validJob

  function handleApply() {
    if (!canApply) return
    if (claims?.role !== 'CANDIDATE') {
      router.push(`/entrar?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    applyMut.mutate()
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <PublicHeader />

      {brandingQ.data?.banner?.url ? (
        <div className="relative h-40 w-full overflow-hidden border-b border-border sm:h-52 lg:h-64">
          <img src={brandingQ.data.banner.url} alt="" className="h-full w-full object-cover" />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--background)_0%,transparent_55%)]"
            aria-hidden
          />
        </div>
      ) : (
        <div
          className="pointer-events-none h-24 bg-[radial-gradient(ellipse_70%_100%_at_0%_0%,var(--color-accent)/0.12,transparent_60%)]"
          aria-hidden
        />
      )}

      <main className="page-container relative flex w-full max-w-3xl flex-1 flex-col gap-6 pb-12 pt-6 lg:pb-16">
        <div>
          <Button
            variant="outline"
            size="sm"
            className="min-h-10 gap-1.5 rounded-xl bg-card"
            asChild
          >
            <Link href="/vagas">
              <ArrowLeft className="size-4" aria-hidden />
              Todas as vagas
            </Link>
          </Button>
        </div>

        {(!validTenant || !validJob) && (
          <Alert variant="destructive">
            <AlertDescription>Link da vaga inválido.</AlertDescription>
          </Alert>
        )}

        {jobQ.isLoading && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {jobQ.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível carregar esta vaga. Ela pode não estar mais disponível.
            </AlertDescription>
          </Alert>
        )}

        {job && (
          <>
            <article className="rounded-2xl border border-border bg-card p-6 shadow-[0_10px_30px_oklch(18%_0.008_60/0.05)] sm:p-8">
              <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {brandingQ.data?.logo?.url ? (
                  <Link
                    href={`/carreiras/${tenantId}`}
                    className="shrink-0 self-start rounded-xl border border-border bg-background p-2 transition-colors hover:bg-muted"
                    aria-label="Ver página da empresa"
                  >
                    <img src={brandingQ.data.logo.url} alt="" className="size-14 object-contain" />
                  </Link>
                ) : (
                  <span className="flex size-15 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Building2 className="size-6" aria-hidden />
                  </span>
                )}

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                      {job.title}
                    </h1>
                    <JobStatusBadge status={job.status} audience="public" />
                  </div>

                  {companyName ? (
                    <p className="inline-flex min-w-0 items-center gap-2.5 text-sm">
                      <Building2
                        className="size-4 shrink-0 text-primary"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <Link
                        href={`/carreiras/${tenantId}`}
                        className="truncate font-medium text-foreground hover:text-primary"
                      >
                        {companyName}
                      </Link>
                    </p>
                  ) : null}

                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
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
                    <p className="inline-flex min-w-0 items-center gap-2.5 text-sm text-foreground">
                      <Briefcase
                        className="size-4 shrink-0 text-primary"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      {job.seniority}
                    </p>
                  ) : null}
                </div>
              </header>

              <div className="mt-8 border-t border-border pt-8">
                <h2 className="font-display text-lg font-semibold tracking-tight">Sobre o cargo</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {job.description}
                </p>
              </div>
            </article>

            <aside className="rounded-2xl border border-border bg-card p-5 shadow-[0_10px_30px_oklch(18%_0.008_60/0.05)] sm:p-6">
              <h2 className="font-display text-base font-semibold tracking-tight">Candidatura</h2>

              {claims && isCandidate ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  {isSaved || job.status === 'PUBLISHED' || job.status === 'PAUSED' ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 gap-2 rounded-xl"
                      disabled={
                        saveMut.isPending ||
                        unsaveMut.isPending ||
                        savedIdsQ.isLoading ||
                        (!isSaved && job.status !== 'PUBLISHED' && job.status !== 'PAUSED')
                      }
                      onClick={() => {
                        if (isSaved) unsaveMut.mutate()
                        else saveMut.mutate()
                      }}
                    >
                      <Bookmark className="size-4" aria-hidden />
                      {savedIdsQ.isLoading
                        ? 'Verificando…'
                        : isSaved
                          ? 'Remover dos salvos'
                          : 'Salvar vaga'}
                    </Button>
                  ) : null}
                  <Button variant="ghost" className="min-h-11 rounded-xl sm:ml-auto" asChild>
                    <Link href="/candidato/salvas">Ver todas as salvas</Link>
                  </Button>
                </div>
              ) : null}

              <div className="mt-4">
                {!canApply ? (
                  <p className="text-sm text-muted-foreground">
                    Esta posição já não aceita novas candidaturas.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Entre como candidato e envie seu perfil com um clique.
                    </p>
                    <Button
                      size="lg"
                      className="mt-4 min-h-11 w-full gap-2 rounded-xl sm:w-auto"
                      onClick={handleApply}
                      disabled={applyMut.isPending}
                    >
                      <UserRound className="size-5" aria-hidden />
                      {claims?.role === 'CANDIDATE'
                        ? applyMut.isPending
                          ? 'Enviando…'
                          : 'Enviar candidatura'
                        : 'Entrar para candidatar'}
                    </Button>
                  </>
                )}
              </div>
            </aside>
          </>
        )}
      </main>
    </div>
  )
}
