import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { JobStatus, type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { CandidateApplicationEmailNotifier } from '../../infra/email/candidate-application-email.notifier'
import { ApplyToJobUseCase } from './apply-to-job.use-case'

describe('ApplyToJobUseCase', () => {
  const candidateEmails = {
    notifyApplicationSubmitted: jest.fn(),
    notifyHired: jest.fn(),
    notifyRejected: jest.fn(),
  } as unknown as CandidateApplicationEmailNotifier

  it('rejects non-candidate actor', async () => {
    const prisma = {
      candidate: { findFirst: jest.fn() },
      job: { findFirst: jest.fn() },
      application: { create: jest.fn() },
      applicationHistory: { create: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new ApplyToJobUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
      candidateEmails,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER }, { jobId: 'j1' }),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('rejects when job is not accepting applications', async () => {
    const prisma = {
      candidate: { findFirst: jest.fn(async () => ({ id: 'c1' })) },
      job: {
        findFirst: jest.fn(async () => ({ id: 'j1', status: JobStatus.DRAFT })),
      },
      application: { create: jest.fn() },
      applicationHistory: { create: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new ApplyToJobUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
      candidateEmails,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE }, { jobId: 'j1' }),
    ).rejects.toThrow('Job is not accepting applications')
  })

  it('throws when candidate profile missing', async () => {
    const prisma = {
      candidate: { findFirst: jest.fn(async () => null) },
      job: { findFirst: jest.fn() },
      application: { create: jest.fn() },
      applicationHistory: { create: jest.fn() },
    }
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new ApplyToJobUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
      candidateEmails,
    )

    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.CANDIDATE }, { jobId: 'j1' }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
