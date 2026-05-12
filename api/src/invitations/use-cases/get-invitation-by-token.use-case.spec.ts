import { NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { hashInvitationToken } from '../invitation-token'
import { GetInvitationByTokenUseCase } from './get-invitation-by-token.use-case'

describe('GetInvitationByTokenUseCase', () => {
  it('rejects when token does not match any invitation', async () => {
    const prisma = { invitation: { findUnique: jest.fn(async () => null) } }
    const useCase = new GetInvitationByTokenUseCase(prisma as unknown as PrismaClient)

    await expect(useCase.execute('whatever')).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.invitation.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashInvitationToken('whatever') },
      select: expect.any(Object),
    })
  })

  it('rejects expired invitations', async () => {
    const prisma = {
      invitation: {
        findUnique: jest.fn(async () => ({
          email: 'a@a.com',
          role: 'TENANT_ADMIN',
          expiresAt: new Date(Date.now() - 60_000),
          acceptedAt: null,
          revokedAt: null,
          tenant: { id: 't1', name: 'Acme', isActive: true, deletedAt: null },
        })),
      },
    }
    const useCase = new GetInvitationByTokenUseCase(prisma as unknown as PrismaClient)

    await expect(useCase.execute('tok')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('returns the preview when the invitation is valid', async () => {
    const expiresAt = new Date(Date.now() + 3600_000)
    const prisma = {
      invitation: {
        findUnique: jest.fn(async () => ({
          email: 'a@a.com',
          role: 'TENANT_ADMIN',
          expiresAt,
          acceptedAt: null,
          revokedAt: null,
          tenant: { id: 't1', name: 'Acme', isActive: true, deletedAt: null },
        })),
      },
    }
    const useCase = new GetInvitationByTokenUseCase(prisma as unknown as PrismaClient)

    await expect(useCase.execute('tok')).resolves.toEqual({
      email: 'a@a.com',
      role: 'TENANT_ADMIN',
      tenantName: 'Acme',
      expiresAt,
    })
  })
})
