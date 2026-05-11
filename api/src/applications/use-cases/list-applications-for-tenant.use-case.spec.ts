import { ForbiddenException } from '@nestjs/common'
import { type Candidate, type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { CandidateProfileReadService } from '../../candidates/candidate-profile-read.service'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { ListApplicationsForTenantUseCase } from './list-applications-for-tenant.use-case'

const fakeCandidate = {
  id: 'c1',
  userId: 'cu1',
  name: 'C',
  email: 'c@c.com',
  phone: null,
  resumeKey: null,
  avatarKey: null,
  deletedAt: null,
  anonymizedAt: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
} as Candidate

describe('ListApplicationsForTenantUseCase', () => {
  it('rejects candidate actor', async () => {
    const prisma = {
      application: { findMany: jest.fn(), count: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const candidateRead = { toApiRead: jest.fn() }
    const useCase = new ListApplicationsForTenantUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
      candidateRead as unknown as CandidateProfileReadService,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('returns paginated applications', async () => {
    const rows = [{ id: 'a1', candidate: fakeCandidate, job: { id: 'j1' } }]
    const prisma = {
      application: {
        findMany: jest.fn(async () => rows),
        count: jest.fn(async () => 1),
      },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const candidateRead = {
      toApiRead: jest.fn(async (c: Candidate) => {
        const { resumeKey: _rk, avatarKey: _ak, ...rest } = c
        return { ...rest, resumeUrl: null, avatarUrl: null }
      }),
    }
    const useCase = new ListApplicationsForTenantUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
      candidateRead as unknown as CandidateProfileReadService,
    )

    const result = await useCase.execute({ userId: 'u1', role: UserRole.RECRUITER }, { page: 1 })

    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].candidate).not.toHaveProperty('resumeKey')
    expect(candidateRead.toApiRead).toHaveBeenCalledWith(fakeCandidate)
  })
})
