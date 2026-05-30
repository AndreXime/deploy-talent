import type { PrismaClient } from '../../../generated/prisma/client'
import { ListMarketplaceJobsUseCase } from './list-marketplace-jobs.use-case'

describe('ListMarketplaceJobsUseCase', () => {
  it('returns paginated marketplace jobs', async () => {
    const rows = [{ id: 'j1', tenant: { id: 't1', name: 'Acme' } }]
    const prisma = {
      job: {
        findMany: jest.fn(async () => rows),
        count: jest.fn(async () => 1),
      },
    }
    const useCase = new ListMarketplaceJobsUseCase(prisma as unknown as PrismaClient)
    const result = await useCase.execute({ page: 1, limit: 10 })
    expect(result.total).toBe(1)
    expect(result.items[0]?.job.id).toBe('j1')
    expect(result.items[0]?.tenant.id).toBe('t1')
  })
})
