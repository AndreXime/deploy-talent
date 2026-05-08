import { ApplyToJobUseCase } from './apply-to-job.use-case'
import { MoveApplicationUseCase } from './move-application.use-case'

const ApplicationStatus = {
  SOURCED: 'SOURCED',
  APPLIED: 'APPLIED',
  IN_PROGRESS: 'IN_PROGRESS',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  HIRED: 'HIRED',
} as const

const JobStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  PAUSED: 'PAUSED',
  CLOSED: 'CLOSED',
} as const

const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  RECRUITER: 'RECRUITER',
  CANDIDATE: 'CANDIDATE',
} as const

function prismaMock() {
  return {
    candidate: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    job: {
      findFirst: jest.fn(),
    },
    application: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    applicationHistory: {
      create: jest.fn(),
    },
    evaluation: {
      create: jest.fn(),
    },
    tenant: {
      findFirst: jest.fn(),
    },
  }
}

describe('Applications use-cases', () => {
  it('candidate apply requires job published/paused', async () => {
    const prisma = prismaMock()
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new ApplyToJobUseCase(prisma as never, tenantContext as never)

    ;(prisma.candidate.findFirst as jest.Mock).mockResolvedValue({ id: 'c1' })
    ;(prisma.job.findFirst as jest.Mock).mockResolvedValue({ id: 'j1', status: JobStatus.DRAFT })

    await expect(
      useCase.execute(
        { userId: 'u1', role: UserRole.CANDIDATE as unknown as never },
        { jobId: 'j1' },
      ),
    ).rejects.toThrow('Job is not accepting applications')
  })

  it('recruiter move blocks terminal transitions', async () => {
    const prisma = prismaMock()
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new MoveApplicationUseCase(prisma as never, tenantContext as never)

    ;(prisma.application.findFirst as jest.Mock).mockResolvedValue({
      id: 'a1',
      tenantId: 't1',
      status: ApplicationStatus.REJECTED,
      stage: null,
    })

    await expect(
      useCase.execute({ userId: 'u2', role: UserRole.RECRUITER as unknown as never }, 'a1', {
        status: ApplicationStatus.IN_PROGRESS as unknown as never,
      }),
    ).rejects.toThrow('Invalid application transition')
  })
})
