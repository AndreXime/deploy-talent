'use client'

import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
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
import { ApiRequestError } from '@/lib/api/client'
import { createJob } from '@/lib/api/jobs-api'
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'

export default function NewJobPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [modality, setModality] = useState('')
  const [location, setLocation] = useState('')
  const [seniority, setSeniority] = useState('')

  const mut = useMutation({
    mutationFn: () =>
      createJob(requireSessionToken(token), {
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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 lg:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/empresa/vagas">Voltar</Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova vaga</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Começa em estado de rascunho até publicar com todos os campos necessários preenchidos.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados principais</CardTitle>
          <CardDescription>Há texto visível apenas à equipa até publicar.</CardDescription>
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
          <Button type="button" disabled={mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? 'A guardar…' : 'Criar rascunho'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
