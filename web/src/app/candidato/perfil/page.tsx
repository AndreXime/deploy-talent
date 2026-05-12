'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { forgetMe, getMyProfile, patchMyProfile } from '@/lib/api/candidates-api'
import type { PatchCandidateProfileBody } from '@/lib/api/types'
import { ApiRequestError } from '@/lib/api/client'
import { presignUpload, uploadFileToPresignedUrl } from '@/lib/api/media-api'
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'

const IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'] as const

const RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

function mimeForFile(file: File): string {
  return IMAGE_ACCEPT.includes(file.type as (typeof IMAGE_ACCEPT)[number]) ? file.type : 'image/jpeg'
}

function nameInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return (first + last).toUpperCase()
}

function resumeContentType(file: File): string {
  if (RESUME_TYPES.includes(file.type as (typeof RESUME_TYPES)[number])) return file.type
  const n = file.name.toLowerCase()
  if (n.endsWith('.pdf')) return 'application/pdf'
  if (n.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (n.endsWith('.doc')) return 'application/msword'
  throw new Error('Currículo: use PDF, DOC ou DOCX.')
}

export default function CandidateProfilePage() {
  const { token, signOut } = useAuth()
  const queryClient = useQueryClient()
  const [forgetOpen, setForgetOpen] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  const profileQ = useQuery({
    enabled: !!token,
    queryKey: ['my-profile', token],
    queryFn: () => getMyProfile(requireSessionToken(token)),
  })

  useEffect(() => {
    const p = profileQ.data
    if (!p) return
    setName(p.name)
    setPhone(p.phone ?? '')
  }, [profileQ.data])

  const patchMut = useMutation({
    mutationFn: (body: PatchCandidateProfileBody) =>
      patchMyProfile(requireSessionToken(token), body),
    onSuccess: (data) => {
      queryClient.setQueryData(['my-profile', token], data)
      toast.success('Perfil atualizado.')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível guardar.')
    },
  })

  const forgetMut = useMutation({
    mutationFn: () => forgetMe(requireSessionToken(token)),
    onSuccess: async () => {
      toast.success('Conta tratada segundo o pedido.')
      queryClient.clear()
      signOut()
      window.location.href = '/'
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Pedido incompleto.')
    },
  })

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !token) return

    setUploadingAvatar(true)
    try {
      const ctype = mimeForFile(file)
      const presigned = await presignUpload(token, {
        purpose: 'CANDIDATE_AVATAR',
        contentType: ctype,
      })
      await uploadFileToPresignedUrl(presigned.url, file, ctype)
      await patchMut.mutateAsync({ avatarKey: presigned.key })
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível enviar o ficheiro.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function removeAvatar() {
    if (!token) return
    await patchMut.mutateAsync({ avatarKey: '' })
  }

  async function onResumePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !token) return

    setUploadingResume(true)
    try {
      const ctype = resumeContentType(file)
      const presigned = await presignUpload(token, {
        purpose: 'CANDIDATE_RESUME',
        contentType: ctype,
        fileName: file.name,
      })
      await uploadFileToPresignedUrl(presigned.url, file, ctype)
      await patchMut.mutateAsync({ resumeKey: presigned.key })
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else if (err instanceof Error) toast.error(err.message)
      else toast.error('Não foi possível enviar o currículo.')
    } finally {
      setUploadingResume(false)
    }
  }

  async function removeResume() {
    if (!token) return
    await patchMut.mutateAsync({ resumeKey: '' })
  }

  function saveProfile(ev: React.FormEvent) {
    ev.preventDefault()
    const body: Record<string, string> = {}
    if (profileQ.data) {
      if (name.trim() !== profileQ.data.name) body.name = name.trim()
      const nextPhone = phone.trim()
      const prevPhone = profileQ.data.phone ?? ''
      if (nextPhone !== prevPhone) {
        if (nextPhone.length > 0 && nextPhone.length < 5) {
          toast.error('Telefone precisa de pelo menos 5 caracteres quando preenchido.')
          return
        }
        if (nextPhone.length >= 5) body.phone = nextPhone
      }
    }
    if (Object.keys(body).length === 0) {
      toast.message('Sem alterações para guardar.')
      return
    }
    patchMut.mutate(body)
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:max-w-2xl lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">O meu perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estes dados acompanham todas as suas candidaturas futuras e atuais.
        </p>
      </div>

      {profileQ.isLoading && <Skeleton className="h-80 w-full" />}

      {profileQ.data?.anonymizedAt && (
        <Alert>
          <AlertDescription>
            Este perfil já foi tratado segundo um pedido de eliminação de dados.
          </AlertDescription>
        </Alert>
      )}

      {profileQ.data && !profileQ.data.anonymizedAt && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Informação de contacto</CardTitle>
            <CardDescription>
              E-mail: <span className="font-medium">{profileQ.data.email}</span> (não editável
              aqui).
            </CardDescription>
          </CardHeader>
          <form onSubmit={saveProfile}>
            <CardContent className="flex flex-col gap-4">
              <div className="space-y-3">
                <Label>Foto de perfil</Label>
                <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center">
                  <Avatar className="size-32">
                    <AvatarImage
                      src={profileQ.data.avatarUrl ?? undefined}
                      alt={profileQ.data.name}
                    />
                    <AvatarFallback className="text-2xl">
                      {nameInitials(profileQ.data.name)}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept={IMAGE_ACCEPT.join(',')}
                    className="hidden"
                    onChange={onAvatarPick}
                  />
                  <div className="flex flex-col items-center gap-2 lg:items-start">
                    <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={uploadingAvatar}
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        {uploadingAvatar
                          ? 'A enviar…'
                          : profileQ.data.avatarUrl
                            ? 'Trocar foto'
                            : 'Enviar foto'}
                      </Button>
                      {profileQ.data.avatarUrl ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={uploadingAvatar}
                          onClick={removeAvatar}
                        >
                          Remover foto
                        </Button>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP — até 10 MB</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label>Currículo</Label>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={onResumePick}
                />
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {profileQ.data.resumeUrl ? (
                      <Button asChild variant="outline">
                        <a href={profileQ.data.resumeUrl} target="_blank" rel="noreferrer">
                          Ver currículo
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={uploadingResume}
                      onClick={() => resumeInputRef.current?.click()}
                    >
                      {uploadingResume
                        ? 'A enviar…'
                        : profileQ.data.resumeUrl
                          ? 'Trocar currículo'
                          : 'Enviar currículo'}
                    </Button>
                    {profileQ.data.resumeUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={uploadingResume}
                        onClick={removeResume}
                      >
                        Remover currículo
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">PDF, DOC ou DOCX — até 10 MB</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button type="submit" disabled={patchMut.isPending}>
                {patchMut.isPending ? 'A guardar…' : 'Guardar alterações'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={forgetMut.isPending}
                className="ml-auto"
                onClick={() => setForgetOpen(true)}
              >
                Eliminar conta e dados
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Dialog open={forgetOpen} onOpenChange={setForgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar dados pessoais</DialogTitle>
            <DialogDescription>
              Esta ação é permanente dentro do funcionamento habitual da plataforma: dados de perfil
              são removidos ou anonimizados e deixa de conseguir aceder ao histórico com a mesma
              identidade. Confirma que é isto mesmo que quer?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setForgetOpen(false)}>
              Voltar atrás
            </Button>
            <Button type="button" variant="destructive" onClick={() => forgetMut.mutate()}>
              {forgetMut.isPending ? 'A processar…' : 'Confirmar eliminação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
