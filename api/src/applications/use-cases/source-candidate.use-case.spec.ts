import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { SourceCandidateUseCase } from './source-candidate.use-case'

jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed'),
}))

describe('SourceCandidateUseCase', () => {
  it('throws when job not found', async () => {
    const prisma = {
      job: { findFirst: jest.fn(async () => null) },
      candidate: { findFirst: jest.fn(), create: jest.fn() },
      application: { create: jest.fn() },
      applicationHistory: { create: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new SourceCandidateUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute(
        { userId: 'u1', role: UserRole.RECRUITER },
        {
          jobId: 'j1',
          candidateEmail: 'c@c.com',
          candidateName: 'C',
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejects candidate actor', async () => {
    const prisma = {
      job: { findFirst: jest.fn() },
      candidate: { findFirst: jest.fn(), create: jest.fn() },
      application: { create: jest.fn() },
      applicationHistory: { create: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new SourceCandidateUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute(
        { userId: 'u1', role: UserRole.CANDIDATE },
        {
          jobId: 'j1',
          candidateEmail: 'c@c.com',
          candidateName: 'C',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
