import type { PrismaClient } from '../../../generated/prisma/client'
import { GetMarketplaceJobFilterOptionsUseCase } from './get-marketplace-job-filter-options.use-case'

describe('GetMarketplaceJobFilterOptionsUseCase', () => {
  it('aggregates distinct filter options', async () => {
    const prisma = {
      job: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ modality: 'REMOTE' }])
          .mockResolvedValueOnce([{ location: 'SP' }])
          .mockResolvedValueOnce([{ seniority: 'SENIOR' }])
          .mockResolvedValueOnce([{ tenant: { id: 't1', name: 'Acme' } }]),
      },
    }
    const useCase = new GetMarketplaceJobFilterOptionsUseCase(prisma as unknown as PrismaClient)
    const result = await useCase.execute()
    expect(result.modalities).toEqual(['REMOTE'])
    expect(result.locations).toEqual(['SP'])
    expect(result.seniorities).toEqual(['SENIOR'])
    expect(result.tenants).toEqual([{ id: 't1', name: 'Acme' }])
  })
})
