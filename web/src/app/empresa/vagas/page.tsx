'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronRight, PlusCircle, Users } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { JobStatusBadge } from '@/components/status-badge'
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
import { listTenantJobs } from '@/lib/api/jobs-api'
import type { ApiJobStatus } from '@/lib/api/types'
import { jobStatusLabel } from '@/lib/domain-labels'
import { useAuth } from '@/providers/auth-provider'

const JOB_STATUS_OPTIONS: ApiJobStatus[] = ['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED']

export default function TenantJobsPage() {
  const { claims } = useAuth()
  const [status, setStatus] = useState<ApiJobStatus | 'ALL'>('ALL')

  const q = useQuery({
    enabled: !!claims,
    queryKey: ['tenant-jobs', claims?.sub, status],
    queryFn: () =>
      listTenantJobs({
        page: 1,
        limit: 50,
        status: status === 'ALL' ? undefined : status,
      }),
  })

  const rows = q.data?.items ?? []

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vagas da empresa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie, edite e controle onde cada posição está no ciclo de publicação.
          </p>
        </div>
        <Button className="shrink-0 gap-2" asChild>
          <Link href="/empresa/vagas/nova">
            <PlusCircle className="size-4" aria-hidden />
            Nova vaga
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="job_status_filter">
          Filtrar por estado
        </label>
        <select
          id="job_status_filter"
          value={status}
          onChange={(e) => setStatus(e.target.value as ApiJobStatus | 'ALL')}
          className="flex h-10 w-full max-w-[220px] rounded-lg border border-input bg-transparent px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="ALL">Todas</option>
          {JOB_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {jobStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {q.isError && (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível carregar as vagas.</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Senioridade</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-end">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading ? (
              <JobsLoadingRows />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Sem vagas com este critério. Crie uma nova posição quando estiver preparado.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell className="text-muted-foreground">{job.modality}</TableCell>
                  <TableCell className="text-muted-foreground">{job.location}</TableCell>
                  <TableCell className="text-muted-foreground">{job.seniority}</TableCell>
                  <TableCell>
                    <JobStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="outline" size="sm" className="gap-1" asChild>
                        <Link href={`/empresa/candidaturas?jobId=${job.id}`}>
                          <Users className="size-4" aria-hidden />
                          Ver candidatos
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1" asChild>
                        <Link href={`/empresa/vagas/${job.id}`}>
                          Gerir
                          <ChevronRight className="size-4" aria-hidden />
                        </Link>
                      </Button>
                    </div>
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

function JobsLoadingRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell className="text-end">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
