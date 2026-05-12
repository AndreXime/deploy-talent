import { PRISMA_CLIENT } from '../infra/prisma/prisma.constants'

export function createTenantContextMock(tenantId: string | null) {
  return {
    getTenantId: () => tenantId,
  }
}

export interface PrismaMock {
  user?: Record<string, unknown>
  tenant?: Record<string, unknown>
  candidate?: Record<string, unknown>
  job?: Record<string, unknown>
  application?: Record<string, unknown>
  applicationHistory?: Record<string, unknown>
  evaluation?: Record<string, unknown>
}

export function providePrismaMock(prisma: PrismaMock) {
  return {
    provide: PRISMA_CLIENT,
    useValue: prisma,
  }
}
