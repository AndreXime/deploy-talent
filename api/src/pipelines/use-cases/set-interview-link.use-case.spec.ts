import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PipelineStageKind, UserRole } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { SetInterviewLinkUseCase } from './set-interview-link.use-case'

describe('SetInterviewLinkUseCase', () => {
  const actor = { userId: 'u1', role: UserRole.RECRUITER, tenantId: 't1' }

  it('rejects candidates', async () => {
    const useCase = new SetInterviewLinkUseCase(
      {} as PrismaClient,
      { requireTenantId: () => 't1' } as TenantContextService,
    )
    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE, tenantId: null }, 'a1', 's1', {}),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws when application not found', async () => {
    const prisma = {
      application: { findFirst: jest.fn(async () => null) },
      jobStage: { findUnique: jest.fn() },
      applicationStageProgress: { upsert: jest.fn() },
    }
    const useCase = new SetInterviewLinkUseCase(
      prisma as unknown as PrismaClient,
      { requireTenantId: () => 't1' } as TenantContextService,
    )
    await expect(
      useCase.execute(actor, 'a1', 's1', { url: 'https://meet.example.com' }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('throws when stage is not INTERVIEW_LINK', async () => {
    const prisma = {
      application: { findFirst: jest.fn(async () => ({ id: 'a1', jobId: 'j1' })) },
      jobStage: {
        findUnique: jest.fn(async () => ({
          id: 's1',
          jobId: 'j1',
          kind: PipelineStageKind.MANUAL,
        })),
      },
      applicationStageProgress: { upsert: jest.fn() },
    }
    const useCase = new SetInterviewLinkUseCase(
      prisma as unknown as PrismaClient,
      { requireTenantId: () => 't1' } as TenantContextService,
    )
    await expect(
      useCase.execute(actor, 'a1', 's1', { url: 'https://meet.example.com' }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
