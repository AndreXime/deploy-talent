'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { patchB2BAvatar } from '@/lib/api/auth-api'
import { ApiRequestError } from '@/lib/api/client'
import { presignUpload, uploadFileToPresignedUrl } from '@/lib/api/media-api'
import { getApiBaseUrl } from '@/lib/env'
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'

const IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

function mime(file: File): string {
  return IMAGE_ACCEPT.includes(file.type) ? file.type : 'image/jpeg'
}

export default function B2BAccountPage() {
  const { token } = useAuth()
  const noApi = !getApiBaseUrl()

  const patchMut = useMutation({
    mutationFn: (avatarKey: string) => patchB2BAvatar(requireSessionToken(token), avatarKey),
    onSuccess: () => toast.success('Foto da conta actualizada.'),
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível guardar.')
    },
  })

  async function onAvatar(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f || !token) return
    try {
      const ct = mime(f)
      const presigned = await presignUpload(token, {
        purpose: 'B2B_USER_AVATAR',
        contentType: ct,
      })
      await uploadFileToPresignedUrl(presigned.url, f, ct)
      patchMut.mutate(presigned.key)
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível enviar o ficheiro.')
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">A minha conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Foto usada internamente na equipa (não confundir com a marca pública da empresa).
        </p>
      </div>
      {noApi && (
        <Alert variant="destructive">
          <AlertDescription>
            Defina <code>NEXT_PUBLIC_API_BASE_URL</code>.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Foto de perfil</CardTitle>
          <CardDescription>JPEG, PNG ou WebP.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="av">Ficheiro</Label>
            <Input
              id="av"
              type="file"
              accept={IMAGE_ACCEPT.join(',')}
              onChange={onAvatar}
              className="cursor-pointer"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={patchMut.isPending}
            onClick={() => patchMut.mutate('')}
          >
            Remover foto
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
