'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ApplicationStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listTenantApplications } from '@/lib/api/applications-api'
import { getTenantJob } from '@/lib/api/jobs-api'
import type { ApiApplicationStatus } from '@/lib/api/types'
import { applicationStatusLabel } from '@/lib/domain-labels'
import { useAuth } from '@/providers/auth-provider'

const APPLICATION_STATUS_OPTIONS: ApiApplicationStatus[] = [
  'SOURCED',
  'APPLIED',
  'IN_PROGRESS',
  'REJECTED',
  'WITHDRAWN',
  'HIRED',
]

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TenantApplicationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId') ?? undefined
  const { claims } = useAuth()
  const [status, setStatus] = useState<ApiApplicationStatus | 'ALL'>('ALL')

  const q = useQuery({
    enabled: !!claims,
    queryKey: ['tenant-applications', claims?.sub, status, jobId],
    queryFn: () =>
      listTenantApplications({
        page: 1,
        limit: 50,
        status: status === 'ALL' ? undefined : status,
        jobId,
      }),
  })

  const jobQ = useQuery({
    enabled: !!claims && !!jobId,
    queryKey: ['tenant-job', claims?.sub, jobId],
    queryFn: () => getTenantJob(jobId as string),
  })

  const clearJobFilter = () => {
    router.replace('/empresa/candidaturas')
  }

  const rows = q.data?.items ?? []

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Candidaturas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulte quem está em processo e abra o detalhe para movimentar o funil.
        </p>
      </div>

      {jobId && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">A mostrar candidaturas da vaga</span>
          <span className="font-medium">
            {jobQ.isLoading ? <Skeleton className="inline-block h-4 w-32 align-middle" /> : null}
            {jobQ.data?.title}
            {jobQ.isError ? 'desconhecida' : null}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto gap-1"
            onClick={clearJobFilter}
          >
            <X className="size-4" aria-hidden />
            Limpar filtro
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="application_status_filter">
          Filtrar por estado
        </label>
        <select
          id="application_status_filter"
          value={status}
          onChange={(e) => setStatus(e.target.value as ApiApplicationStatus | 'ALL')}
          className="flex h-10 w-full max-w-[280px] rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="ALL">Todas</option>
          {APPLICATION_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {applicationStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {q.isError && (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível carregar candidaturas.</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidato</TableHead>
              <TableHead>Vaga</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Última atualização</TableHead>
              <TableHead className="text-end">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading ? (
              <ApplicationsLoadingRows />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  {jobId
                    ? 'Esta vaga ainda não tem candidaturas.'
                    : 'Não há candidaturas com este filtro.'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.candidate.name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.job.title}</TableCell>
                  <TableCell>
                    <ApplicationStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.currentStage?.name ?? <span className="opacity-50">sem etapa</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatUpdatedAt(row.updatedAt)}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button variant="outline" size="sm" className="gap-1" asChild>
                      <Link href={`/empresa/candidaturas/${row.id}`}>
                        Abrir ficha
                        <ChevronRight className="size-4" aria-hidden />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}

function ApplicationsLoadingRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-24 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="text-end">
            <Skeleton className="ml-auto h-8 w-24" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
