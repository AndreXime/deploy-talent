'use client'

import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHead } from '@/components/page-head'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WorkbenchPageShell } from '@/components/workbench-page-shell'
import { ApiRequestError } from '@/lib/api/client'
import { createJob } from '@/lib/api/jobs-api'

export default function NewJobPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [modality, setModality] = useState('')
  const [location, setLocation] = useState('')
  const [seniority, setSeniority] = useState('')

  const mut = useMutation({
    mutationFn: () =>
      createJob({
        title,
        description,
        modality,
        location,
        seniority,
        status: 'DRAFT',
      }),
    onSuccess: (job) => {
      toast.success('Vaga criada como rascunho.')
      router.replace(`/empresa/vagas/${job.id}`)
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível criar.')
    },
  })

  return (
    <WorkbenchPageShell className="max-w-2xl">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/empresa/vagas">Voltar</Link>
        </Button>
      </div>
      <PageHead
        title="Nova vaga"
        description="A vaga começa como rascunho. Complete os campos e publique quando estiver pronta."
      />
      <Card className="rounded-2xl border-border shadow-[0_10px_30px_oklch(18%_0.008_60/0.04)]">
        <CardHeader>
          <CardTitle className="font-display">Dados principais</CardTitle>
          <CardDescription>Há texto visível apenas à equipe até publicar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              minLength={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Descrição</Label>
            <Textarea
              id="desc"
              rows={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="resize-y"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="mod">Modalidade</Label>
              <Input
                id="mod"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc">Localização</Label>
              <Input
                id="loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sen">Senioridade</Label>
              <Input
                id="sen"
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 border-t px-6 py-4">
          <Button
            type="button"
            disabled={mut.isPending}
            className="min-h-11 rounded-full"
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? 'Salvando…' : 'Criar rascunho'}
          </Button>
        </CardFooter>
      </Card>
    </WorkbenchPageShell>
  )
}
