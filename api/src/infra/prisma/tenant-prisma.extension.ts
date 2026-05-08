import { Prisma } from '../../../generated/prisma/client'
import type { TenantContextService } from '../../tenant-context/tenant-context.service'

interface QueryParams<TArgs> {
  args: TArgs
  query: (args: TArgs) => Promise<unknown>
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

export function tenantPrismaExtension(tenantContext: TenantContextService) {
  return Prisma.defineExtension((client) =>
    client.$extends({
      name: 'tenant-logical-rls',
      query: {
        job: {
          async findMany(params: QueryParams<Prisma.JobFindManyArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToWhere(params.args, tenantId)
            return params.query(params.args)
          },
          async findFirst(params: QueryParams<Prisma.JobFindFirstArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToWhere(params.args, tenantId)
            return params.query(params.args)
          },
          async count(params: QueryParams<Prisma.JobCountArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToWhere(params.args, tenantId)
            return params.query(params.args)
          },
          async create(params: QueryParams<Prisma.JobCreateArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToData(params.args, tenantId)
            return params.query(params.args)
          },
          async createMany(params: QueryParams<Prisma.JobCreateManyArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToData(params.args, tenantId)
            return params.query(params.args)
          },
          async updateMany(params: QueryParams<Prisma.JobUpdateManyArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToWhere(params.args, tenantId)
            return params.query(params.args)
          },
          async deleteMany(params: QueryParams<Prisma.JobDeleteManyArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToWhere(params.args, tenantId)
            return params.query(params.args)
          },
        },
        application: {
          async findMany(params: QueryParams<Prisma.ApplicationFindManyArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToWhere(params.args, tenantId)
            return params.query(params.args)
          },
          async findFirst(params: QueryParams<Prisma.ApplicationFindFirstArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToWhere(params.args, tenantId)
            return params.query(params.args)
          },
          async count(params: QueryParams<Prisma.ApplicationCountArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToWhere(params.args, tenantId)
            return params.query(params.args)
          },
          async create(params: QueryParams<Prisma.ApplicationCreateArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToData(params.args, tenantId)
            return params.query(params.args)
          },
          async createMany(params: QueryParams<Prisma.ApplicationCreateManyArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToData(params.args, tenantId)
            return params.query(params.args)
          },
          async updateMany(params: QueryParams<Prisma.ApplicationUpdateManyArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToWhere(params.args, tenantId)
            return params.query(params.args)
          },
          async deleteMany(params: QueryParams<Prisma.ApplicationDeleteManyArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToWhere(params.args, tenantId)
            return params.query(params.args)
          },
        },
        applicationHistory: {
          async findMany(params: QueryParams<Prisma.ApplicationHistoryFindManyArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToWhere(params.args, tenantId)
            return params.query(params.args)
          },
          async create(params: QueryParams<Prisma.ApplicationHistoryCreateArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToData(params.args, tenantId)
            return params.query(params.args)
          },
        },
        evaluation: {
          async findMany(params: QueryParams<Prisma.EvaluationFindManyArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToWhere(params.args, tenantId)
            return params.query(params.args)
          },
          async create(params: QueryParams<Prisma.EvaluationCreateArgs>) {
            const tenantId = getTenantId(tenantContext)
            if (tenantId) addTenantIdToData(params.args, tenantId)
            return params.query(params.args)
          },
        },
      },
    }),
  )
}
