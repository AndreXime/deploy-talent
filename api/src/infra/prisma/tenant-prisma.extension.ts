import { Prisma } from '../../../generated/prisma/client'
import type { TenantContextService } from '../../tenant-context/tenant-context.service'

interface QueryParams<TArgs> {
  args: TArgs
  query: (args: TArgs) => Promise<unknown>
}

interface TenantScopedModelDelegate {
  findFirst(args?: { where?: Record<string, unknown> }): Promise<unknown>
  updateMany(args: { where?: Record<string, unknown>; data?: unknown }): Promise<{ count: number }>
  deleteMany(args: { where?: Record<string, unknown> }): Promise<{ count: number }>
}

function getTenantId(tenantContext: TenantContextService): string | null {
  return tenantContext.getTenantId()
}

function addTenantIdToWhere<TArgs extends { where?: Record<string, unknown> | undefined }>(
  args: TArgs,
  tenantId: string,
): void {
  const where = (args.where ?? {}) as Record<string, unknown>
  args.where = { ...where, tenantId }
}

function addTenantIdToData<TArgs extends { data: unknown }>(args: TArgs, tenantId: string): void {
  if (Array.isArray(args.data)) {
    args.data = args.data.map((item) => {
      if (item !== null && typeof item === 'object') {
        return { ...(item as Record<string, unknown>), tenantId }
      }
      return item
    })
    return
  }

  if (args.data !== null && typeof args.data === 'object') {
    args.data = { ...(args.data as Record<string, unknown>), tenantId }
  }
}

export function createTenantScopedHandlers(
  model: TenantScopedModelDelegate,
  tenantContext: TenantContextService,
) {
  return {
    async findMany(params: QueryParams<{ where?: Record<string, unknown> }>) {
      const tenantId = getTenantId(tenantContext)
      if (tenantId) addTenantIdToWhere(params.args, tenantId)
      return params.query(params.args)
    },
    async findFirst(params: QueryParams<{ where?: Record<string, unknown> }>) {
      const tenantId = getTenantId(tenantContext)
      if (tenantId) addTenantIdToWhere(params.args, tenantId)
      return params.query(params.args)
    },
    async findUnique(params: QueryParams<{ where?: Record<string, unknown> }>) {
      const tenantId = getTenantId(tenantContext)
      if (!tenantId) return params.query(params.args)
      addTenantIdToWhere(params.args, tenantId)
      return model.findFirst(params.args)
    },
    async count(params: QueryParams<{ where?: Record<string, unknown> }>) {
      const tenantId = getTenantId(tenantContext)
      if (tenantId) addTenantIdToWhere(params.args, tenantId)
      return params.query(params.args)
    },
    async create(params: QueryParams<{ data: unknown }>) {
      const tenantId = getTenantId(tenantContext)
      if (tenantId) addTenantIdToData(params.args, tenantId)
      return params.query(params.args)
    },
    async createMany(params: QueryParams<{ data: unknown }>) {
      const tenantId = getTenantId(tenantContext)
      if (tenantId) addTenantIdToData(params.args, tenantId)
      return params.query(params.args)
    },
    async update(params: QueryParams<{ where?: Record<string, unknown>; data: unknown }>) {
      const tenantId = getTenantId(tenantContext)
      if (!tenantId) return params.query(params.args)
      const whereArgs = { where: { ...(params.args.where ?? {}) } }
      addTenantIdToWhere(whereArgs, tenantId)
      const { count } = await model.updateMany({
        where: whereArgs.where,
        data: params.args.data,
      })
      if (count === 0) {
        return params.query({ ...params.args, where: { id: '__tenant_rls_miss__' } })
      }
      const id = whereArgs.where?.id
      if (typeof id === 'string') {
        return model.findFirst({ where: { id, tenantId } })
      }
      return params.query(params.args)
    },
    async updateMany(params: QueryParams<{ where?: Record<string, unknown> }>) {
      const tenantId = getTenantId(tenantContext)
      if (tenantId) addTenantIdToWhere(params.args, tenantId)
      return params.query(params.args)
    },
    async delete(params: QueryParams<{ where?: Record<string, unknown> }>) {
      const tenantId = getTenantId(tenantContext)
      if (!tenantId) return params.query(params.args)
      const whereArgs = { where: { ...(params.args.where ?? {}) } }
      const id = whereArgs.where?.id
      if (typeof id !== 'string') {
        return params.query({ ...params.args, where: { id: '__tenant_rls_miss__' } })
      }
      addTenantIdToWhere(whereArgs, tenantId)
      const existing = await model.findFirst({ where: whereArgs.where })
      if (!existing) {
        return params.query({ ...params.args, where: { id: '__tenant_rls_miss__' } })
      }
      await model.deleteMany({ where: whereArgs.where })
      return existing
    },
    async deleteMany(params: QueryParams<{ where?: Record<string, unknown> }>) {
      const tenantId = getTenantId(tenantContext)
      if (tenantId) addTenantIdToWhere(params.args, tenantId)
      return params.query(params.args)
    },
  }
}

export function tenantPrismaExtension(tenantContext: TenantContextService) {
  return Prisma.defineExtension((client) => {
    const jobHandlers = createTenantScopedHandlers(client.job, tenantContext)
    const applicationHandlers = createTenantScopedHandlers(client.application, tenantContext)
    const applicationHistoryHandlers = createTenantScopedHandlers(
      client.applicationHistory,
      tenantContext,
    )

    return client.$extends({
      name: 'tenant-logical-rls',
      query: {
        job: jobHandlers,
        application: applicationHandlers,
        applicationHistory: applicationHistoryHandlers,
      },
    })
  })
}
