'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { ImageAssetField } from '@/components/image-asset-field'
import { PageHead } from '@/components/page-head'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkbenchPageShell } from '@/components/workbench-page-shell'
import { getMyB2BAccount, patchB2BAvatar } from '@/lib/api/auth-api'
import { ApiRequestError } from '@/lib/api/client'
import { presignUpload, uploadFileToPresignedUrl } from '@/lib/api/media-api'
import { useAuth } from '@/providers/auth-provider'

const IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

function imageContentType(file: File): string {
  return IMAGE_ACCEPT.includes(file.type) ? file.type : 'image/jpeg'
}

export default function B2BAccountPage() {
  const { claims } = useAuth()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const accountQ = useQuery({
    enabled: !!claims,
    queryKey: ['b2b-account', claims?.sub],
    queryFn: () => getMyB2BAccount(),
  })

  const patchMut = useMutation({
    mutationFn: (avatarKey: string) => patchB2BAvatar(avatarKey),
    onSuccess: (data) => {
      queryClient.setQueryData(['b2b-account', claims?.sub], data)
      toast.success('Foto da conta atualizada.')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível guardar.')
    },
  })

  async function uploadAvatar(file: File): Promise<void> {
    if (!claims) return
    setUploading(true)
    try {
      const ct = imageContentType(file)
      const presigned = await presignUpload({
        purpose: 'B2B_USER_AVATAR',
        contentType: ct,
      })
      await uploadFileToPresignedUrl(presigned.url, file, ct)
      await patchMut.mutateAsync(presigned.key)
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível enviar o arquivo.')
    } finally {
      setUploading(false)
    }
  }

  async function removeAvatar(): Promise<void> {
    await patchMut.mutateAsync('')
  }

  return (
    <WorkbenchPageShell className="max-w-lg">
      <PageHead
        title="Minha conta"
        description="Foto usada internamente na equipe (não confundir com a marca pública da empresa)."
      />

      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="font-display">Foto de perfil</CardTitle>
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
    </WorkbenchPageShell>
  )
}
