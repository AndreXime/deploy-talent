import { BadRequestException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { CreateRecruiterUseCase } from './create-recruiter.use-case'

jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed'),
}))

describe('CreateRecruiterUseCase', () => {
  it('throws when tenant invalid', async () => {
    const prisma = {
      tenant: { findFirst: jest.fn(async () => null) },
      user: { findFirst: jest.fn(), create: jest.fn() },
    }
    const tenantContext = { requireTenantId: () => 't1' }
    const useCase = new CreateRecruiterUseCase(
      prisma as unknown as PrismaClient,
      tenantContext as unknown as TenantContextService,
    )

    await expect(useCase.execute({ email: 'a@a.com', password: 'p' })).rejects.toBeInstanceOf(
      BadRequestException,
    )
  })
})
