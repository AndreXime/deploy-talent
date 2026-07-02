'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { ImageAssetField } from '@/components/image-asset-field'
import { PageHead } from '@/components/page-head'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkbenchPageShell } from '@/components/workbench-page-shell'
import { ApiRequestError } from '@/lib/api/client'
import { presignUpload, uploadFileToPresignedUrl } from '@/lib/api/media-api'
import { getCurrentTenant, getPublicBranding, patchCurrentBranding } from '@/lib/api/tenants-api'
import { useAuth } from '@/providers/auth-provider'

const IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

function imageContentType(file: File): string {
  return IMAGE_ACCEPT.includes(file.type) ? file.type : 'image/jpeg'
}

type AssetKind = 'logo' | 'banner'

export default function TenantBrandingPage() {
  const { claims } = useAuth()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState<AssetKind | null>(null)

  const tenantQ = useQuery({
    enabled: !!claims,
    queryKey: ['company-shell-current-tenant', claims?.sub],
    queryFn: () => getCurrentTenant(),
  })

  const brandingQ = useQuery({
    enabled: !!tenantQ.data?.id,
    queryKey: ['tenant-branding-preview', tenantQ.data?.id],
    queryFn: () => getPublicBranding(tenantQ.data?.id as string),
  })

  const patchMut = useMutation({
    mutationFn: (body: { logoKey?: string; bannerKey?: string }) => patchCurrentBranding(body),
    onSuccess: () => {
      toast.success('Marca atualizada.')
      queryClient.invalidateQueries({ queryKey: ['tenant-branding-preview', tenantQ.data?.id] })
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível atualizar.')
    },
    onSettled: () => setBusy(null),
  })

  async function upload(kind: AssetKind, file: File): Promise<void> {
    if (!claims) return
    setBusy(kind)
    try {
      const ct = imageContentType(file)
      const purpose = kind === 'logo' ? 'TENANT_LOGO' : 'TENANT_BANNER'
      const presigned = await presignUpload({ purpose, contentType: ct })
      await uploadFileToPresignedUrl(presigned.url, file, ct)
      patchMut.mutate(kind === 'logo' ? { logoKey: presigned.key } : { bannerKey: presigned.key })
    } catch (err: unknown) {
      setBusy(null)
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível enviar o arquivo.')
    }
  }

  function remove(kind: AssetKind): void {
    setBusy(kind)
    patchMut.mutate(kind === 'logo' ? { logoKey: '' } : { bannerKey: '' })
  }

  const logoUrl = brandingQ.data?.logo?.url ?? null
  const bannerUrl = brandingQ.data?.banner?.url ?? null

  return (
    <WorkbenchPageShell className="max-w-xl">
      <PageHead
        title="Marca no site de carreiras"
        description="Estas imagens aparecem no topo da página pública de vagas da sua empresa."
      />

      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="font-display">Logótipo</CardTitle>
          <CardDescription>Formato quadrado funciona melhor em listagens.</CardDescription>
        </CardHeader>
        <CardContent>
          {brandingQ.isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <ImageAssetField
              currentUrl={logoUrl}
              aspect="square"
              alt={`Logótipo de ${brandingQ.data?.name ?? ''}`}
              hint="JPG, PNG ou WEBP."
              uploading={busy === 'logo' && patchMut.isPending}
              removing={busy === 'logo' && patchMut.isPending && logoUrl !== null}
              onUpload={(file) => upload('logo', file)}
              onRemove={() => remove('logo')}
            />
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="font-display">Banner</CardTitle>
          <CardDescription>
            Imagem larga opcional para reforçar a identidade visual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brandingQ.isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <ImageAssetField
              currentUrl={bannerUrl}
              aspect="wide"
              alt={`Banner de ${brandingQ.data?.name ?? ''}`}
              hint="Recomendado 1600x400 (JPG, PNG ou WEBP)."
              uploading={busy === 'banner' && patchMut.isPending}
              removing={busy === 'banner' && patchMut.isPending && bannerUrl !== null}
              onUpload={(file) => upload('banner', file)}
              onRemove={() => remove('banner')}
            />
          )}
        </CardContent>
      </Card>
    </WorkbenchPageShell>
  )
}
