import { ForbiddenException, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { UserRole } from '../../../generated/prisma/client'
import { SaveJobUseCase } from './save-job.use-case'

describe('SaveJobUseCase', () => {
  const actor = { userId: 'u1', role: UserRole.CANDIDATE, tenantId: null }

  it('rejects non-candidates', async () => {
    const useCase = new SaveJobUseCase({} as PrismaClient)
    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER, tenantId: 't1' }, 'j1'),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws when candidate profile missing', async () => {
    const prisma = { candidate: { findFirst: jest.fn(async () => null) } }
    const useCase = new SaveJobUseCase(prisma as unknown as PrismaClient)
    await expect(useCase.execute(actor, 'j1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('returns existing saved job', async () => {
    const savedAt = new Date('2026-01-01')
    const prisma = {
      candidate: { findFirst: jest.fn(async () => ({ id: 'c1' })) },
      savedJob: {
        findUnique: jest.fn(async () => ({
          createdAt: savedAt,
          job: { id: 'j1', title: 'Dev', tenant: { id: 't1', name: 'Acme' } },
        })),
      },
    }
    const useCase = new SaveJobUseCase(prisma as unknown as PrismaClient)
    const result = await useCase.execute(actor, 'j1')
    expect(result.savedAt).toEqual(savedAt)
    expect(result.job.id).toBe('j1')
  })
})
