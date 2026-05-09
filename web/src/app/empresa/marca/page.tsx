'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiRequestError } from '@/lib/api/client'
import { presignUpload, uploadFileToPresignedUrl } from '@/lib/api/media-api'
import { patchCurrentBranding } from '@/lib/api/tenants-api'
import { getApiBaseUrl } from '@/lib/env'
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'

const IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

function mime(file: File): string {
  return IMAGE_ACCEPT.includes(file.type) ? file.type : 'image/jpeg'
}

export default function TenantBrandingPage() {
  const { token } = useAuth()
  const noApi = !getApiBaseUrl()

  const patchMut = useMutation({
    mutationFn: (body: { logoKey?: string; bannerKey?: string }) =>
      patchCurrentBranding(requireSessionToken(token), body),
    onSuccess: () => toast.success('Marca atualizada.'),
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível atualizar.')
    },
  })

  async function upload(purpose: 'TENANT_LOGO' | 'TENANT_BANNER', file: File): Promise<void> {
    if (!token) return
    const ct = mime(file)
    const presigned = await presignUpload(token, { purpose, contentType: ct })
    await uploadFileToPresignedUrl(presigned.url, file, ct)
    if (purpose === 'TENANT_LOGO') {
      patchMut.mutate({ logoKey: presigned.key })
    } else {
      patchMut.mutate({ bannerKey: presigned.key })
    }
  }

  async function onLogo(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f || !token) return
    try {
      await upload('TENANT_LOGO', f)
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível enviar o logótipo.')
    }
  }

  async function onBanner(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f || !token) return
    try {
      await upload('TENANT_BANNER', f)
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível enviar a imagem.')
    }
  }

  function clearLogo() {
    patchMut.mutate({ logoKey: '' })
  }

  function clearBanner() {
    patchMut.mutate({ bannerKey: '' })
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marca no site de carreiras</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estas imagens aparecem no topo da página pública de vagas da sua empresa.
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
          <CardTitle>Logótipo</CardTitle>
          <CardDescription>Formato quadrado funciona melhor em listagens.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="logo">Ficheiro</Label>
            <Input
              id="logo"
              type="file"
              accept={IMAGE_ACCEPT.join(',')}
              onChange={onLogo}
              className="cursor-pointer"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearLogo}
            disabled={patchMut.isPending}
          >
            Remover logótipo
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Banner</CardTitle>
          <CardDescription>
            Imagem larga opcional para reforçar a identidade visual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="banner">Ficheiro</Label>
            <Input
              id="banner"
              type="file"
              accept={IMAGE_ACCEPT.join(',')}
              onChange={onBanner}
              className="cursor-pointer"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearBanner}
            disabled={patchMut.isPending}
          >
            Remover banner
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
