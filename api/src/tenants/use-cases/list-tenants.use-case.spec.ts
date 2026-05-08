import type { PrismaClient } from '../../../generated/prisma/client'
import { ListTenantsUseCase } from './list-tenants.use-case'

describe('ListTenantsUseCase', () => {
  it('returns tenants ordered by createdAt desc', async () => {
    const rows = [{ id: 't2' }, { id: 't1' }]
    const prisma = {
      tenant: {
        findMany: jest.fn(async () => rows),
      },
    }
    const useCase = new ListTenantsUseCase(prisma as unknown as PrismaClient)

    const result = await useCase.execute()

    expect(prisma.tenant.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } })
    expect(result).toEqual(rows)
  })
})
