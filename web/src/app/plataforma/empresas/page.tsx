'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createTenantAdminRequest } from '@/lib/api/auth-api'
import { ApiRequestError } from '@/lib/api/client'
import {
  activateTenant,
  createTenant,
  listPlatformTenants,
  softDeleteTenant,
  suspendTenant,
} from '@/lib/api/tenants-api'
import { getApiBaseUrl } from '@/lib/env'
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'

export default function PlatformTenantsPage() {
  const { token } = useAuth()
  const qc = useQueryClient()
  const noApi = !getApiBaseUrl()

  const [createOpen, setCreateOpen] = useState(false)
  const [cName, setCName] = useState('')
  const [cSlug, setCSlug] = useState('')
  const [adminOpen, setAdminOpen] = useState<string | null>(null)
  const [admEmail, setAdmEmail] = useState('')
  const [admPass, setAdmPass] = useState('')

  const listQ = useQuery({
    enabled: !!token && !noApi,
    queryKey: ['platform-tenants', token],
    queryFn: () => listPlatformTenants(requireSessionToken(token)),
  })

  const createMut = useMutation({
    mutationFn: () =>
      createTenant(requireSessionToken(token), { name: cName.trim(), slug: cSlug.trim() }),
    onSuccess: () => {
      toast.success('Empresa registada.')
      setCreateOpen(false)
      setCName('')
      setCSlug('')
      qc.invalidateQueries({ queryKey: ['platform-tenants', token] })
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível criar.')
    },
  })

  const adminMut = useMutation({
    mutationFn: () =>
      createTenantAdminRequest(requireSessionToken(token), {
        tenantId: adminOpen ?? '',
        email: admEmail.trim(),
        password: admPass,
      }),
    onSuccess: () => {
      toast.success('Administrador da empresa criado.')
      setAdminOpen(null)
      setAdmEmail('')
      setAdmPass('')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível criar o administrador.')
    },
  })

  async function mutateTenant(
    id: string,
    action: 'suspend' | 'activate' | 'delete',
  ): Promise<void> {
    try {
      if (action === 'suspend') await suspendTenant(requireSessionToken(token), id)
      else if (action === 'activate') await activateTenant(requireSessionToken(token), id)
      else await softDeleteTenant(requireSessionToken(token), id)
      toast.success('Estado actualizado.')
      qc.invalidateQueries({ queryKey: ['platform-tenants', token] })
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Operação incompleta.')
    }
  }

  const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cSlug.trim())

  return (
    <main className="flex flex-1 flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Controlo alto nível sobre quem pode operar nesta infraestrutura.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Nova empresa
        </Button>
      </div>

      {noApi && (
        <Alert variant="destructive">
          <AlertTitle>API</AlertTitle>
          <AlertDescription>
            Defina <code>NEXT_PUBLIC_API_BASE_URL</code>.
          </AlertDescription>
        </Alert>
      )}

      {listQ.isLoading && <Skeleton className="h-64 w-full" />}

      {!listQ.isLoading && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Listagem</CardTitle>
            <CardDescription>
              O identificador curto (slug) segue o padrão interno de validação da API.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-end">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQ.data?.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.slug}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {row.deletedAt && <Badge variant="outline">Eliminado</Badge>}
                        {!row.deletedAt && row.isActive && <Badge variant="outline">Activo</Badge>}
                        {!row.deletedAt && !row.isActive && (
                          <Badge variant="outline">Suspenso</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          disabled={!!row.deletedAt}
                          onClick={() => setAdminOpen(row.id)}
                        >
                          Criar admin
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          disabled={!!row.deletedAt}
                          onClick={() =>
                            mutateTenant(row.id, row.isActive ? 'suspend' : 'activate').catch(
                              () => undefined,
                            )
                          }
                        >
                          {row.deletedAt ? '—' : row.isActive ? 'Suspender' : 'Reativar'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          type="button"
                          disabled={!!row.deletedAt}
                          onClick={() => mutateTenant(row.id, 'delete').catch(() => undefined)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova empresa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="tname">Nome comercial</Label>
              <Input
                id="tname"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                maxLength={120}
                minLength={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tslug">Identificador curto (slug)</Label>
              <Input
                id="tslug"
                value={cSlug}
                onChange={(e) => setCSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                maxLength={80}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={createMut.isPending || !cName.trim() || !slugValid}
              onClick={() => createMut.mutate()}
            >
              Confirmar criação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adminOpen !== null} onOpenChange={(open) => !open && setAdminOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Administrador desta empresa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="aem">E-mail inicial</Label>
              <Input
                id="aem"
                type="email"
                value={admEmail}
                onChange={(e) => setAdmEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apw">Palavra-passe inicial</Label>
              <Input
                id="apw"
                type="password"
                minLength={8}
                value={admPass}
                onChange={(e) => setAdmPass(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAdminOpen(null)}>
              Voltar
            </Button>
            <Button
              type="button"
              disabled={adminMut.isPending || !admEmail.trim() || admPass.length < 8}
              onClick={() => adminMut.mutate()}
            >
              Criar administrador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
