'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PageHead } from '@/components/page-head'
import { JobStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { WorkbenchPageShell } from '@/components/workbench-page-shell'
import { sourceCandidate } from '@/lib/api/applications-api'
import { ApiRequestError } from '@/lib/api/client'
import { changeJobStatus, getTenantJob, patchJob } from '@/lib/api/jobs-api'
import type { ApiJobStatus } from '@/lib/api/types'
import { jobStatusLabel } from '@/lib/domain-labels'
import { isUuid } from '@/lib/is-uuid'
import { canPublishJob, nextJobStatuses } from '@/lib/pipeline-rules'
import { useAuth } from '@/providers/auth-provider'

export default function TenantJobDetailPage() {
  const params = useParams<{ jobId: string }>()
  const jobId = params?.jobId ?? ''
  const { claims } = useAuth()
  const qc = useQueryClient()
  const valid = isUuid(jobId.trim())

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [modality, setModality] = useState('')
  const [location, setLocation] = useState('')
  const [seniority, setSeniority] = useState('')
  const [sourceOpen, setSourceOpen] = useState(false)
  const [sEmail, setSEmail] = useState('')
  const [sName, setSName] = useState('')

  const jobQ = useQuery({
    enabled: !!claims && valid,
    queryKey: ['tenant-job', claims?.sub, jobId],
    queryFn: () => getTenantJob(jobId.trim()),
  })

  useEffect(() => {
    const j = jobQ.data
    if (!j) return
    setTitle(j.title)
    setDescription(j.description)
    setModality(j.modality)
    setLocation(j.location)
    setSeniority(j.seniority)
  }, [jobQ.data])

  const patchMut = useMutation({
    mutationFn: () =>
      patchJob(jobId.trim(), {
        title,
        description,
        modality,
        location,
        seniority,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-job', claims?.sub, jobId] })
      qc.invalidateQueries({ queryKey: ['tenant-jobs', claims?.sub] })
      toast.success('Alterações gravadas.')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Falha ao guardar.')
    },
  })

  const statusMut = useMutation({
    mutationFn: (next: ApiJobStatus) => changeJobStatus(jobId.trim(), next),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-job', claims?.sub, jobId] })
      qc.invalidateQueries({ queryKey: ['tenant-jobs', claims?.sub] })
      toast.success('Estado da vaga atualizado.')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Transição não permitida ou dados em falta.')
    },
  })

  const sourceMut = useMutation({
    mutationFn: () =>
      sourceCandidate({
        jobId: jobId.trim(),
        candidateEmail: sEmail.trim(),
        candidateName: sName.trim(),
      }),
    onSuccess: (result) => {
      switch (result.outcome) {
        case 'CANDIDATE_INVITED':
          toast.success('Convite de candidato enviado por email.')
          break
        case 'JOB_LINK_SENT':
          toast.success('Email enviado com o link da vaga.')
          break
        case 'ALREADY_APPLIED':
          toast.info('Este candidato já tem candidatura para esta vaga.')
          break
      }
      setSourceOpen(false)
      setSEmail('')
      setSName('')
      qc.invalidateQueries({ queryKey: ['tenant-applications', claims?.sub] })
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível registar sourcing.')
    },
  })

  const j = jobQ.data
  const nextStatuses = j ? nextJobStatuses(j.status) : []
  const publishReady =
    j?.status === 'DRAFT' &&
    canPublishJob({
      title,
      description,
      modality,
      location,
      seniority,
    })

  return (
    <WorkbenchPageShell className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm" className="w-fit" asChild>
          <Link href="/empresa/vagas">Todas as vagas</Link>
        </Button>
        {valid && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/empresa/vagas/${jobId}/etapas`}>Configurar etapas</Link>
          </Button>
        )}
      </div>

      {!valid && (
        <Alert variant="destructive">
          <AlertDescription>Identificação inválida.</AlertDescription>
        </Alert>
      )}

      {jobQ.isLoading && <Skeleton className="h-96 w-full" />}
      {jobQ.isError && (
        <Alert variant="destructive">
          <AlertDescription>Vaga não encontrada.</AlertDescription>
        </Alert>
      )}

      {j && (
        <>
          <PageHead title="Gerir posição">
            <JobStatusBadge status={j.status} />
          </PageHead>

          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="font-display">Editar textos públicos futuros</CardTitle>
              <CardDescription>O que aparece aos candidatos após publicar.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="jt">Título</Label>
                <Input id="jt" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jd">Descrição</Label>
                <Textarea
                  id="jd"
                  rows={10}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-y"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="jm">Modalidade</Label>
                  <Input id="jm" value={modality} onChange={(e) => setModality(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jl">Localização</Label>
                  <Input id="jl" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="js">Senioridade</Label>
                  <Input id="js" value={seniority} onChange={(e) => setSeniority(e.target.value)} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t">
              <Button
                type="button"
                disabled={patchMut.isPending}
                className="min-h-11"
                onClick={() => patchMut.mutate()}
              >
                {patchMut.isPending ? 'A guardar…' : 'Guardar alterações'}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="font-display">Ciclo de publicação</CardTitle>
              <CardDescription>
                Avance apenas para estados seguintes válidos nesta ferramenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {j.status === 'DRAFT' && nextStatuses.includes('PUBLISHED') && !publishReady && (
                <p className="text-sm text-muted-foreground">
                  Complete título, descrição e os três campos curtos (modalidade, localização e
                  senioridade com conteúdo real) antes de conseguir publicar.
                </p>
              )}
              {nextStatuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este estado já não permite novas mudanças.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant="outline"
                      disabled={
                        statusMut.isPending ||
                        (s === 'PUBLISHED' && j.status === 'DRAFT' && !publishReady)
                      }
                      onClick={() => statusMut.mutate(s)}
                    >
                      Mudar para {jobStatusLabel(s)}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="font-display">Sourcing por email</CardTitle>
                <CardDescription>
                  Convida um candidato externo a candidatar-se. A plataforma decide qual email
                  enviar conforme o candidato já tenha conta ou candidatura nesta vaga.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                className="gap-2 shrink-0"
                type="button"
                onClick={() => setSourceOpen(true)}
              >
                <UserPlus className="size-4" aria-hidden />
                Novo sourcing
              </Button>
            </CardHeader>
          </Card>

          <Dialog open={sourceOpen} onOpenChange={setSourceOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Prospectar candidato para {j.title}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 pt-2 text-sm text-muted-foreground">
                <p>
                  Se o email ainda não estiver na plataforma, o candidato recebe convite para criar
                  conta. Se já tiver conta sem candidatura nesta vaga, recebe o link da vaga. Caso
                  já se tenha candidatado, nada é enviado.
                </p>
              </div>
              <div className="grid gap-3 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="cn">Nome</Label>
                  <Input
                    id="cn"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    minLength={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ce">Email</Label>
                  <Input
                    id="ce"
                    type="email"
                    value={sEmail}
                    onChange={(e) => setSEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setSourceOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={
                    sourceMut.isPending || sEmail.trim().length === 0 || sName.trim().length < 2
                  }
                  className="min-h-11"
                  onClick={() => sourceMut.mutate()}
                >
                  Enviar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </WorkbenchPageShell>
  )
}
