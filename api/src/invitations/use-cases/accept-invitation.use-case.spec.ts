import { ConflictException, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { LoginUseCase } from '../../auth/use-cases/login.use-case'
import { AcceptInvitationUseCase } from './accept-invitation.use-case'

jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed'),
}))

function buildLoginUseCase(): LoginUseCase {
  return {
    execute: jest.fn(async () => ({ access_token: 'jwt' })),
  } as unknown as LoginUseCase
}

describe('AcceptInvitationUseCase', () => {
  it('rejects when token is unknown', async () => {
    const prisma = { invitation: { findUnique: jest.fn(async () => null) } }
    const useCase = new AcceptInvitationUseCase(
      prisma as unknown as PrismaClient,
      buildLoginUseCase(),
    )

    await expect(useCase.execute('tok', 'password1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejects when invitation was already accepted', async () => {
    const prisma = {
      invitation: {
        findUnique: jest.fn(async () => ({
          id: 'i1',
          email: 'a@a.com',
          role: 'TENANT_ADMIN',
          expiresAt: new Date(Date.now() + 3600_000),
          acceptedAt: new Date(),
          revokedAt: null,
          tenant: { id: 't1', isActive: true, deletedAt: null },
        })),
      },
    }
    const useCase = new AcceptInvitationUseCase(
      prisma as unknown as PrismaClient,
      buildLoginUseCase(),
    )

    await expect(useCase.execute('tok', 'password1')).rejects.toBeInstanceOf(ConflictException)
  })

  it('creates the user, marks the invitation as accepted and returns a JWT', async () => {
    const createdUser = {
      id: 'u1',
      email: 'a@a.com',
      tenantId: 't1',
      role: 'TENANT_ADMIN',
    }
    const tx = {
      user: { create: jest.fn(async () => createdUser) },
      invitation: { updateMany: jest.fn(async () => ({ count: 1 })) },
    }
    const prisma = {
      invitation: {
        findUnique: jest.fn(async () => ({
          id: 'i1',
          email: 'a@a.com',
          role: 'TENANT_ADMIN',
          expiresAt: new Date(Date.now() + 3600_000),
          acceptedAt: null,
          revokedAt: null,
          tenant: { id: 't1', isActive: true, deletedAt: null },
        })),
      },
      user: { findFirst: jest.fn(async () => null) },
      $transaction: jest.fn(async (cb: (tx: typeof tx) => Promise<unknown>) => cb(tx)),
    }
    const login = buildLoginUseCase()
    const useCase = new AcceptInvitationUseCase(prisma as unknown as PrismaClient, login)

    const result = await useCase.execute('tok', 'password1')

    expect(result).toEqual({ access_token: 'jwt' })
    expect(tx.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'a@a.com',
        role: 'TENANT_ADMIN',
        tenantId: 't1',
        passwordHash: 'hashed',
      }),
    })
    expect(tx.invitation.updateMany).toHaveBeenCalledWith({
      where: { id: 'i1', acceptedAt: null, revokedAt: null },
      data: expect.objectContaining({ acceptedAt: expect.any(Date) }),
    })
    expect((login.execute as jest.Mock).mock.calls[0][0]).toEqual(createdUser)
  })

  it('also accepts RECRUITER invitations and provisions the user with that role', async () => {
    const createdUser = {
      id: 'u2',
      email: 'rec@a.com',
      tenantId: 't1',
      role: 'RECRUITER',
    }
    const tx = {
      user: { create: jest.fn(async () => createdUser) },
      invitation: { updateMany: jest.fn(async () => ({ count: 1 })) },
    }
    const prisma = {
      invitation: {
        findUnique: jest.fn(async () => ({
          id: 'i2',
          email: 'rec@a.com',
          role: 'RECRUITER',
          expiresAt: new Date(Date.now() + 3600_000),
          acceptedAt: null,
          revokedAt: null,
          tenant: { id: 't1', isActive: true, deletedAt: null },
        })),
      },
      user: { findFirst: jest.fn(async () => null) },
      $transaction: jest.fn(async (cb: (tx: typeof tx) => Promise<unknown>) => cb(tx)),
    }
    const login = buildLoginUseCase()
    const useCase = new AcceptInvitationUseCase(prisma as unknown as PrismaClient, login)

    const result = await useCase.execute('tok', 'password1')

    expect(result).toEqual({ access_token: 'jwt' })
    expect(tx.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'rec@a.com',
        role: 'RECRUITER',
        tenantId: 't1',
        passwordHash: 'hashed',
      }),
    })
  })

  it('aceita convite CANDIDATE: cria User CANDIDATE sem tenant e Candidate com o nome do convite', async () => {
    const createdUser = {
      id: 'u3',
      email: 'cand@a.com',
      tenantId: null,
      role: 'CANDIDATE',
    }
    const tx = {
      user: { create: jest.fn(async () => createdUser) },
      candidate: { create: jest.fn(async () => ({ id: 'cand1' })) },
      invitation: { updateMany: jest.fn(async () => ({ count: 1 })) },
    }
    const prisma = {
      invitation: {
        findUnique: jest.fn(async () => ({
          id: 'i3',
          email: 'cand@a.com',
          name: 'Cândida',
          role: 'CANDIDATE',
          expiresAt: new Date(Date.now() + 3600_000),
          acceptedAt: null,
          revokedAt: null,
          tenant: null,
        })),
      },
      user: { findFirst: jest.fn(async () => null) },
      $transaction: jest.fn(async (cb: (tx: typeof tx) => Promise<unknown>) => cb(tx)),
    }
    const login = buildLoginUseCase()
    const useCase = new AcceptInvitationUseCase(prisma as unknown as PrismaClient, login)

    const result = await useCase.execute('tok', 'password1')

    expect(result).toEqual({ access_token: 'jwt' })
    expect(tx.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'cand@a.com',
        role: 'CANDIDATE',
        tenantId: null,
        passwordHash: 'hashed',
      }),
    })
    expect(tx.candidate.create).toHaveBeenCalledWith({
      data: {
        userId: 'u3',
        name: 'Cândida',
        email: 'cand@a.com',
      },
    })
  })

  it('rejects when the email belongs to an existing user between preview and accept', async () => {
    const prisma = {
      invitation: {
        findUnique: jest.fn(async () => ({
          id: 'i1',
          email: 'a@a.com',
          role: 'TENANT_ADMIN',
          expiresAt: new Date(Date.now() + 3600_000),
          acceptedAt: null,
          revokedAt: null,
          tenant: { id: 't1', isActive: true, deletedAt: null },
        })),
      },
      user: { findFirst: jest.fn(async () => ({ id: 'u9' })) },
      $transaction: jest.fn(),
    }
    const useCase = new AcceptInvitationUseCase(
      prisma as unknown as PrismaClient,
      buildLoginUseCase(),
    )

    await expect(useCase.execute('tok', 'password1')).rejects.toBeInstanceOf(ConflictException)
  })
})
