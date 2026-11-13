'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronRight, PlusCircle, Users } from 'lucide-react'
import Link from 'next/link'
import { type ReactNode, useMemo, useState } from 'react'
import { PageHead } from '@/components/page-head'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { WorkbenchPageShell } from '@/components/workbench-page-shell'
import { listTenantJobs } from '@/lib/api/jobs-api'
import type { ApiJobStatus } from '@/lib/api/types'
import { jobStatusLabel } from '@/lib/domain-labels'
import { useAuth } from '@/providers/auth-provider'

const JOB_STATUS_OPTIONS: ApiJobStatus[] = ['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED']
const FILTER_ALL = 'ALL'

const tablePanelClass =
  'overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_30px_oklch(18%_0.008_60/0.04)]'

export default function TenantJobsPage() {
  const { claims } = useAuth()
  const [status, setStatus] = useState<ApiJobStatus | typeof FILTER_ALL>(FILTER_ALL)

  const q = useQuery({
    enabled: !!claims,
    queryKey: ['tenant-jobs', claims?.sub, status],
    queryFn: () =>
      listTenantJobs({
        page: 1,
        limit: 50,
        status: status === FILTER_ALL ? undefined : status,
      }),
  })

  const rows = q.data?.items ?? []

  const statusItems = useMemo(() => {
    const rec: Record<string, ReactNode> = {
      [FILTER_ALL]: 'Todas',
    }
    for (const s of JOB_STATUS_OPTIONS) {
      rec[s] = jobStatusLabel(s)
    }
    return rec
  }, [])

  return (
    <WorkbenchPageShell>
      <PageHead
        title="Vagas"
        description="Crie, publique e acompanhe cada posição no ciclo de recrutamento."
      >
        <Button className="min-h-11 shrink-0 gap-2 rounded-full" asChild>
          <Link href="/empresa/vagas/nova">
            <PlusCircle className="size-4" aria-hidden />
            Nova vaga
          </Link>
        </Button>
      </PageHead>

      <div className="flex max-w-xs flex-col gap-2">
        <Label htmlFor="job_status_filter">Filtrar por status</Label>
        <Select
          value={status}
          items={statusItems}
          onValueChange={(v) => {
            if (v == null) return
            setStatus(v as ApiJobStatus | typeof FILTER_ALL)
          }}
        >
          <SelectTrigger
            id="job_status_filter"
            size="default"
            className="h-10 w-full min-w-0 rounded-xl"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={FILTER_ALL}>Todas</SelectItem>
            {JOB_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {jobStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {q.isError && (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível carregar as vagas.</AlertDescription>
        </Alert>
      )}

      <div className={tablePanelClass}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Senioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading ? (
              <JobsLoadingRows />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      {status === FILTER_ALL
                        ? 'Nenhuma vaga ainda. Crie a primeira posição para começar a receber candidatos.'
                        : 'Nenhuma vaga com este status. Ajuste o filtro ou crie uma nova posição.'}
                    </p>
                    <Button className="min-h-10 gap-2 rounded-full" asChild>
                      <Link href="/empresa/vagas/nova">
                        <PlusCircle className="size-4" aria-hidden />
                        Nova vaga
                      </Link>
                    </Button>
                  </div>
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
                      <Button variant="outline" size="sm" className="gap-1 rounded-xl" asChild>
                        <Link href={`/empresa/candidaturas?jobId=${job.id}`}>
                          <Users className="size-4" aria-hidden />
                          Ver candidatos
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 rounded-xl" asChild>
                        <Link href={`/empresa/vagas/${job.id}`}>
                          Gerenciar
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
    </WorkbenchPageShell>
  )
}

function JobsLoadingRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <TableRow key={`jobs-skel-${i}`}>
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
