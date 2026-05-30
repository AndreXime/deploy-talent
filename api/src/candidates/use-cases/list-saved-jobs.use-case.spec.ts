import { ForbiddenException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { ListSavedJobsUseCase } from './list-saved-jobs.use-case'

describe('ListSavedJobsUseCase', () => {
  const actor = { userId: 'u1', role: UserRole.CANDIDATE, tenantId: null }

  it('rejects non-candidates', async () => {
    const useCase = new ListSavedJobsUseCase({} as PrismaClient)
    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER, tenantId: 't1' }),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('returns paginated saved jobs', async () => {
    const prisma = {
      candidate: { findFirst: jest.fn(async () => ({ id: 'c1' })) },
      savedJob: {
        findMany: jest.fn(async () => [
          {
            createdAt: new Date('2026-01-01'),
            job: { id: 'j1', title: 'Dev', tenant: { id: 't1', name: 'Acme' } },
          },
        ]),
        count: jest.fn(async () => 1),
      },
    }
    const useCase = new ListSavedJobsUseCase(prisma as unknown as PrismaClient)
    const result = await useCase.execute(actor, { page: 1, limit: 10 })
    expect(result.total).toBe(1)
    expect(result.items[0]?.job.id).toBe('j1')
  })
})
