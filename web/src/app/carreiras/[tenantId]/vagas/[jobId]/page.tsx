'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Bookmark, Building2, MapPin, MonitorSmartphone, User } from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PublicHeader } from '@/components/public-header'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { applyToJob } from '@/lib/api/applications-api'
import { listMySavedJobs, saveJobBookmark, unsaveJob } from '@/lib/api/candidates-api'
import { ApiRequestError } from '@/lib/api/client'
import { getPublicJob } from '@/lib/api/jobs-api'
import { getPublicBranding } from '@/lib/api/tenants-api'
import { getApiBaseUrl } from '@/lib/env'
import { isUuid } from '@/lib/is-uuid'
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'

export default function PublicJobDetailPage() {
  const params = useParams<{ tenantId: string; jobId: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { token, claims } = useAuth()

  const tenantId = params?.tenantId?.trim() ?? ''
  const jobId = params?.jobId?.trim() ?? ''
  const validTenant = isUuid(tenantId)
  const validJob = isUuid(jobId)
  const noApi = !getApiBaseUrl()

  const brandingQ = useQuery({
    enabled: validTenant && !noApi,
    queryKey: ['branding-public', tenantId],
    queryFn: () => getPublicBranding(tenantId),
  })

  const jobQ = useQuery({
    enabled: validTenant && validJob && !noApi,
    queryKey: ['public-job', tenantId, jobId],
    queryFn: () => getPublicJob(tenantId, jobId),
  })

  const isCandidate = claims?.role === 'CANDIDATE'

  const savedIdsQ = useQuery({
    enabled: Boolean(token) && isCandidate && !noApi && validJob,
    queryKey: ['my-saved-job-ids', token],
    queryFn: async () => {
      const res = await listMySavedJobs(requireSessionToken(token), { page: 1, limit: 100 })
      return new Set(res.items.map((row) => row.job.id))
    },
  })

  const isSaved = validJob && jobId ? Boolean(savedIdsQ.data?.has(jobId)) : false

  const saveMut = useMutation({
    mutationFn: () => saveJobBookmark(requireSessionToken(token), jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-saved-job-ids', token] })
      queryClient.invalidateQueries({ queryKey: ['my-saved-jobs', token] })
      toast.success('Vaga guardada na sua lista.')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível guardar.')
    },
  })

  const unsaveMut = useMutation({
    mutationFn: () => unsaveJob(requireSessionToken(token), jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-saved-job-ids', token] })
      queryClient.invalidateQueries({ queryKey: ['my-saved-jobs', token] })
      toast.success('Removida das vagas guardadas.')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível remover.')
    },
  })

  const applyMut = useMutation({
    mutationFn: () => {
      if (!token) throw new Error('Sem sessão.')
      return applyToJob(token, tenantId, { jobId })
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
  const canApply =
    job && (job.status === 'PUBLISHED' || job.status === 'PAUSED') && validTenant && validJob

  function handleApply() {
    if (!canApply) return
    if (!token || claims?.role !== 'CANDIDATE') {
      router.push(`/entrar?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    applyMut.mutate()
  }

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      {brandingQ.data?.banner?.url ? (
        <div className="relative h-40 w-full overflow-hidden border-b sm:h-52 lg:h-64">
          <img src={brandingQ.data.banner.url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 lg:px-6">
        <div className="-ml-3 flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link href="/vagas">
              <ArrowLeft className="size-4" aria-hidden />
              Todas as vagas
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">·</span>
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link href={`/carreiras/${tenantId}`}>
              <Building2 className="size-4" aria-hidden />
              {brandingQ.data?.name ? `Vagas de ${brandingQ.data.name}` : 'Vagas da empresa'}
            </Link>
          </Button>
        </div>

        {noApi && (
          <Alert variant="destructive">
            <AlertDescription>
              Defina <code>NEXT_PUBLIC_API_BASE_URL</code>.
            </AlertDescription>
          </Alert>
        )}

        {(!validTenant || !validJob) && (
          <Alert variant="destructive">
            <AlertDescription>Link da vaga inválido.</AlertDescription>
          </Alert>
        )}

        {jobQ.isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {jobQ.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível carregar esta vaga. Talvez já não esteja disponível.
            </AlertDescription>
          </Alert>
        )}

        {job && (
          <>
            <header className="space-y-3">
              <div className="flex items-start gap-4">
                {brandingQ.data?.logo?.url ? (
                  <Link
                    href={`/carreiras/${tenantId}`}
                    className="shrink-0 rounded-md border bg-card p-1.5 transition hover:bg-accent"
                    aria-label="Ver página da empresa"
                  >
                    <img src={brandingQ.data.logo.url} alt="" className="size-14 object-contain" />
                  </Link>
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
                    <JobStatusBadge status={job.status} audience="public" />
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MonitorSmartphone className="size-4 shrink-0" aria-hidden />
                      {job.modality}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-4 shrink-0" aria-hidden />
                      {job.location}
                    </span>
                  </div>
                </div>
              </div>
              <Separator />
            </header>

            <section className="space-y-2">
              <h2 className="text-lg font-medium">Sobre o cargo</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {job.description}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-medium">Senioridade</h2>
              <p className="text-sm text-muted-foreground">{job.seniority}</p>
            </section>

            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              {token && isCandidate && job ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {isSaved || job.status === 'PUBLISHED' || job.status === 'PAUSED' ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
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
                        ? 'A verificar…'
                        : isSaved
                          ? 'Remover dos guardados'
                          : 'Guardar vaga'}
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm" className="sm:ml-auto" asChild>
                    <Link href="/candidato/guardadas">Ver todas as guardadas</Link>
                  </Button>
                </div>
              ) : null}
              {!canApply ? (
                <p className="text-sm text-muted-foreground">
                  Esta posição já não aceita novas candidaturas.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Inicie sessão como candidato e envie o seu perfil com um clique.
                  </p>
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={handleApply}
                    disabled={applyMut.isPending}
                  >
                    <User className="size-5" aria-hidden />
                    {token && claims?.role === 'CANDIDATE'
                      ? applyMut.isPending
                        ? 'A enviar…'
                        : 'Enviar candidatura'
                      : 'Iniciar sessão para candidatar-me'}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
