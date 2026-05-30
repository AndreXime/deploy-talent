import { ForbiddenException, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { UnsaveJobUseCase } from './unsave-job.use-case'

describe('UnsaveJobUseCase', () => {
  const actor = { userId: 'u1', role: UserRole.CANDIDATE, tenantId: null }

  it('rejects non-candidates', async () => {
    const useCase = new UnsaveJobUseCase({} as PrismaClient)
    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER, tenantId: 't1' }, 'j1'),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws when saved job not found', async () => {
    const prisma = {
      candidate: { findFirst: jest.fn(async () => ({ id: 'c1' })) },
      savedJob: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    }
    const useCase = new UnsaveJobUseCase(prisma as unknown as PrismaClient)
    await expect(useCase.execute(actor, 'j1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('removes saved job', async () => {
    const prisma = {
      candidate: { findFirst: jest.fn(async () => ({ id: 'c1' })) },
      savedJob: { deleteMany: jest.fn(async () => ({ count: 1 })) },
    }
    const useCase = new UnsaveJobUseCase(prisma as unknown as PrismaClient)
    await expect(useCase.execute(actor, 'j1')).resolves.toBeUndefined()
  })
})
