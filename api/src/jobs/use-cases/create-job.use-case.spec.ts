import { BadRequestException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { CreateJobUseCase } from './create-job.use-case'

describe('CreateJobUseCase', () => {
  it('throws when tenant context is missing', async () => {
    const prisma = { job: { create: jest.fn() } }
    const tenantContext = { getTenantId: () => null as string | null }
    const useCase = new CreateJobUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(
      useCase.execute({
        title: 'T',
        description: 'D',
        modality: 'remote',
        location: 'BR',
        seniority: 'mid',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
