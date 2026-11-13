'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { type ReactNode, useMemo, useState } from 'react'
import { PageHead } from '@/components/page-head'
import { ApplicationStatusBadge } from '@/components/status-badge'
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
const FILTER_ALL = 'ALL'

const tablePanelClass =
  'overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_30px_oklch(18%_0.008_60/0.04)]'

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TenantApplicationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId') ?? undefined
  const { claims } = useAuth()
  const [status, setStatus] = useState<ApiApplicationStatus | typeof FILTER_ALL>(FILTER_ALL)

  const q = useQuery({
    enabled: !!claims,
    queryKey: ['tenant-applications', claims?.sub, status, jobId],
    queryFn: () =>
      listTenantApplications({
        page: 1,
        limit: 50,
        status: status === FILTER_ALL ? undefined : status,
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

  const statusItems = useMemo(() => {
    const rec: Record<string, ReactNode> = {
      [FILTER_ALL]: 'Todas',
    }
    for (const s of APPLICATION_STATUS_OPTIONS) {
      rec[s] = applicationStatusLabel(s)
    }
    return rec
  }, [])

  return (
    <WorkbenchPageShell>
      <PageHead
        title="Candidaturas"
        description="Veja quem está no processo e abra a ficha para avançar no funil."
      />

      {jobId && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Mostrando candidaturas da vaga</span>
          <span className="font-medium">
            {jobQ.isLoading ? <Skeleton className="inline-block h-4 w-32 align-middle" /> : null}
            {jobQ.data?.title}
            {jobQ.isError ? 'desconhecida' : null}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto gap-1 rounded-xl"
            onClick={clearJobFilter}
          >
            <X className="size-4" aria-hidden />
            Limpar filtro
          </Button>
        </div>
      )}

      <div className="flex max-w-xs flex-col gap-2">
        <Label htmlFor="application_status_filter">Filtrar por status</Label>
        <Select
          value={status}
          items={statusItems}
          onValueChange={(v) => {
            if (v == null) return
            setStatus(v as ApiApplicationStatus | typeof FILTER_ALL)
          }}
        >
          <SelectTrigger
            id="application_status_filter"
            size="default"
            className="h-10 w-full min-w-0 rounded-xl"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={FILTER_ALL}>Todas</SelectItem>
            {APPLICATION_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {applicationStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {q.isError && (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível carregar candidaturas.</AlertDescription>
        </Alert>
      )}

      <div className={tablePanelClass}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidato</TableHead>
              <TableHead>Vaga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Última atualização</TableHead>
              <TableHead className="text-end">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading ? (
              <ApplicationsLoadingRows />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      {jobId
                        ? 'Esta vaga ainda não recebeu candidaturas. Compartilhe a página pública para atrair profissionais.'
                        : status === FILTER_ALL
                          ? 'Nenhuma candidatura por enquanto. Publique uma vaga e acompanhe as entradas aqui.'
                          : 'Nenhuma candidatura com este status. Tente outro filtro.'}
                    </p>
                    {!jobId ? (
                      <Button variant="outline" className="min-h-10 rounded-full" asChild>
                        <Link href="/empresa/vagas">Ir para vagas</Link>
                      </Button>
                    ) : null}
                  </div>
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
                    <Button variant="outline" size="sm" className="gap-1 rounded-xl" asChild>
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
    </WorkbenchPageShell>
  )
}

function ApplicationsLoadingRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <TableRow key={`apps-skel-${i}`}>
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
