import { ChangeJobStatusUseCase } from './change-job-status.use-case'

const JobStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  PAUSED: 'PAUSED',
  CLOSED: 'CLOSED',
} as const

function prismaMock() {
  return {
    job: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  }
}

describe('ChangeJobStatusUseCase', () => {
  it('rejects invalid status transition', async () => {
    const prisma = prismaMock()
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new ChangeJobStatusUseCase(prisma as never, tenantContext as never)

    ;(prisma.job.findFirst as jest.Mock).mockResolvedValue({
      id: 'j1',
      tenantId: 't1',
      status: JobStatus.DRAFT,
      title: 't',
      description: 'd',
      modality: 'm',
      location: 'l',
      seniority: 's',
    })

    await expect(useCase.execute('j1', JobStatus.PAUSED as unknown as never)).rejects.toThrow(
      'Invalid job transition',
    )
  })

  it('requires publish fields on DRAFT -> PUBLISHED', async () => {
    const prisma = prismaMock()
    const tenantContext = { getTenantId: () => 't1' }
    const useCase = new ChangeJobStatusUseCase(prisma as never, tenantContext as never)

    ;(prisma.job.findFirst as jest.Mock).mockResolvedValue({
      id: 'j1',
      tenantId: 't1',
      status: JobStatus.DRAFT,
      title: '',
      description: 'd',
      modality: 'm',
      location: 'l',
      seniority: 's',
    })

    await expect(
      useCase.execute('j1', JobStatus.PUBLISHED as unknown as never),
    ).rejects.toThrow('Missing required fields to publish')
  })
})
