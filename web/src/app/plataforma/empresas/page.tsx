'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
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
import { ApiRequestError } from '@/lib/api/client'
import { inviteTenantAdminRequest } from '@/lib/api/invitations-api'
import {
  activateTenant,
  approveTenantSignup,
  createTenant,
  listPlatformTenants,
  rejectTenantSignup,
  softDeleteTenant,
  suspendTenant,
} from '@/lib/api/tenants-api'
import { requireSessionToken } from '@/lib/require-session-token'
import { useAuth } from '@/providers/auth-provider'

export default function PlatformTenantsPage() {
  const { token } = useAuth()
  const qc = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [cName, setCName] = useState('')
  const [cSlug, setCSlug] = useState('')
  const [adminOpen, setAdminOpen] = useState<string | null>(null)
  const [admEmail, setAdmEmail] = useState('')

  const listQ = useQuery({
    enabled: !!token,
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

  const inviteMut = useMutation({
    mutationFn: () =>
      inviteTenantAdminRequest(requireSessionToken(token), {
        tenantId: adminOpen ?? '',
        email: admEmail.trim(),
      }),
    onSuccess: () => {
      toast.success('Convite enviado por email.')
      setAdminOpen(null)
      setAdmEmail('')
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível enviar o convite.')
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
      toast.success('Estado atualizado.')
      qc.invalidateQueries({ queryKey: ['platform-tenants', token] })
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Operação incompleta.')
    }
  }

  async function approveSignup(id: string): Promise<void> {
    try {
      await approveTenantSignup(requireSessionToken(token), id)
      toast.success('Registo público aprovado.')
      qc.invalidateQueries({ queryKey: ['platform-tenants', token] })
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível aprovar.')
    }
  }

  async function rejectSignup(id: string): Promise<void> {
    try {
      await rejectTenantSignup(requireSessionToken(token), id)
      toast.success('Pedido recusado e removido.')
      qc.invalidateQueries({ queryKey: ['platform-tenants', token] })
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) toast.error(err.message)
      else toast.error('Não foi possível recusar.')
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

      {listQ.isLoading && <Skeleton className="h-64 w-full" />}

      {!listQ.isLoading && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Listagem</CardTitle>
            <CardDescription>
              Pedidos de empresa feitos em registo público aparecem com a etiqueta Aguarda aprovação
              até o administrador da plataforma aprovar ou recusar. Ao criar empresa aqui, o
              identificador curto (slug) segue o padrão da API.
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
                {listQ.data?.map((row) => {
                  const pending = Boolean(row.signupPending) && !row.deletedAt
                  return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.slug}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {row.deletedAt && <Badge variant="outline">Eliminado</Badge>}
                        {pending && <Badge variant="secondary">Aguarda aprovação</Badge>}
                        {!row.deletedAt && !pending && row.isActive && (
                          <Badge variant="outline">Activo</Badge>
                        )}
                        {!row.deletedAt && !pending && !row.isActive && (
                          <Badge variant="outline">Suspenso</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex flex-wrap justify-end gap-2">
                        {pending ? (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              type="button"
                              onClick={() => approveSignup(row.id).catch(() => undefined)}
                            >
                              Aprovar registo
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => rejectSignup(row.id).catch(() => undefined)}
                            >
                              Recusar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              type="button"
                              onClick={() => mutateTenant(row.id, 'delete').catch(() => undefined)}
                            >
                              Eliminar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              disabled={!!row.deletedAt || !row.isActive}
                              onClick={() => setAdminOpen(row.id)}
                            >
                              Convidar admin
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
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })}
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
            <DialogTitle>Convidar administrador</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Enviamos um link único para o email indicado. O destinatário define a senha ao
              aceitar o convite, e o link expira passadas algumas horas.
            </p>
            <div className="space-y-2">
              <Label htmlFor="aem">Email do administrador</Label>
              <Input
                id="aem"
                type="email"
                value={admEmail}
                onChange={(e) => setAdmEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAdminOpen(null)}>
              Voltar
            </Button>
            <Button
              type="button"
              disabled={inviteMut.isPending || !admEmail.trim()}
              onClick={() => inviteMut.mutate()}
            >
              Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
