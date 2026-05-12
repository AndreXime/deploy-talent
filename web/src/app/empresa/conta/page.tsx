'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { ImageAssetField } from '@/components/image-asset-field'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getMyB2BAccount, patchB2BAvatar } from '@/lib/api/auth-api'
import { ApiRequestError } from '@/lib/api/client'
import { presignUpload, uploadFileToPresignedUrl } from '@/lib/api/media-api'
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'

const IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

function imageContentType(file: File): string {
  return IMAGE_ACCEPT.includes(file.type) ? file.type : 'image/jpeg'
}

export default function B2BAccountPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const accountQ = useQuery({
    enabled: !!token,
    queryKey: ['b2b-account', token],
    queryFn: () => getMyB2BAccount(requireSessionToken(token)),
  })

  const patchMut = useMutation({
    mutationFn: (avatarKey: string) => patchB2BAvatar(requireSessionToken(token), avatarKey),
    onSuccess: (data) => {
      queryClient.setQueryData(['b2b-account', token], data)
      toast.success('Foto da conta atualizada.')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível guardar.')
    },
  })

  async function uploadAvatar(file: File): Promise<void> {
    if (!token) return
    setUploading(true)
    try {
      const ct = imageContentType(file)
      const presigned = await presignUpload(token, {
        purpose: 'B2B_USER_AVATAR',
        contentType: ct,
      })
      await uploadFileToPresignedUrl(presigned.url, file, ct)
      await patchMut.mutateAsync(presigned.key)
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível enviar o ficheiro.')
    } finally {
      setUploading(false)
    }
  }

  async function removeAvatar(): Promise<void> {
    await patchMut.mutateAsync('')
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">A minha conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Foto usada internamente na equipa (não confundir com a marca pública da empresa).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto de perfil</CardTitle>
          <CardDescription>JPEG, PNG ou WebP.</CardDescription>
        </CardHeader>
        <CardContent>
          {accountQ.isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <ImageAssetField
              currentUrl={accountQ.data?.avatarUrl ?? null}
              aspect="square"
              alt={accountQ.data?.email ?? 'Foto de perfil'}
              hint="JPG, PNG ou WEBP."
              uploading={uploading}
              removing={patchMut.isPending && !uploading}
              onUpload={uploadAvatar}
              onRemove={removeAvatar}
            />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
