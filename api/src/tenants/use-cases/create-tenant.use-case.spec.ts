import type { PrismaClient } from '../../../generated/prisma/client'
import { CreateTenantUseCase } from './create-tenant.use-case'

describe('CreateTenantUseCase', () => {
  it('creates tenant with dto fields', async () => {
    const created = { id: 't1', name: 'Acme', slug: 'acme', isActive: true }
    const prisma = {
      tenant: {
        create: jest.fn(async () => created),
      },
    }
    const useCase = new CreateTenantUseCase(prisma as unknown as PrismaClient)

    const result = await useCase.execute({ name: 'Acme', slug: 'acme' })

    expect(prisma.tenant.create).toHaveBeenCalledWith({
      data: { name: 'Acme', slug: 'acme', isActive: true },
    })
    expect(result).toEqual(created)
  })
})
