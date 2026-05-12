import { BadRequestException, ConflictException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { EnvService } from '../../infra/env/env.service'
import {
  InvitationEmailNotifier,
  type TenantAdminInvitationEmailContext,
} from '../invitation-email.notifier'
import { InviteTenantAdminUseCase } from './invite-tenant-admin.use-case'

function buildEnv(): EnvService {
  return {
    invitationTtlHours: 24,
    webBaseUrl: 'http://localhost:3000',
  } as unknown as EnvService
}

function buildNotifier(spy: jest.Mock) {
  return { notifyTenantAdminInvited: spy } as unknown as InvitationEmailNotifier
}

describe('InviteTenantAdminUseCase', () => {
  it('rejects when tenant is inactive or missing', async () => {
    const prisma = {
      tenant: { findFirst: jest.fn(async () => null) },
      user: { findFirst: jest.fn() },
      invitation: { updateMany: jest.fn(), create: jest.fn() },
    }
    const notifier = buildNotifier(jest.fn())
    const useCase = new InviteTenantAdminUseCase(
      prisma as unknown as PrismaClient,
      buildEnv(),
      notifier,
    )

    await expect(
      useCase.execute({ tenantId: 't1', email: 'a@a.com', invitedByUserId: 'u1' }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejects when email already belongs to a user', async () => {
    const prisma = {
      tenant: { findFirst: jest.fn(async () => ({ id: 't1', name: 'Acme' })) },
      user: { findFirst: jest.fn(async () => ({ id: 'u9' })) },
      invitation: { updateMany: jest.fn(), create: jest.fn() },
    }
    const useCase = new InviteTenantAdminUseCase(
      prisma as unknown as PrismaClient,
      buildEnv(),
      buildNotifier(jest.fn()),
    )

    await expect(
      useCase.execute({ tenantId: 't1', email: 'admin@acme.com', invitedByUserId: 'u1' }),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('revokes pending invites, persists hash and sends the email', async () => {
    const created = {
      id: 'inv1',
      email: 'admin@acme.com',
      role: 'TENANT_ADMIN',
      tenantId: 't1',
      expiresAt: new Date(Date.now() + 24 * 3600_000),
    }
    const prisma = {
      tenant: { findFirst: jest.fn(async () => ({ id: 't1', name: 'Acme' })) },
      user: { findFirst: jest.fn(async () => null) },
      invitation: {
        updateMany: jest.fn(async () => ({ count: 0 })),
        create: jest.fn(async () => created),
        update: jest.fn(),
      },
    }
    const notifier = buildNotifier(jest.fn())
    const useCase = new InviteTenantAdminUseCase(
      prisma as unknown as PrismaClient,
      buildEnv(),
      notifier,
    )

    const result = await useCase.execute({
      tenantId: 't1',
      email: 'Admin@Acme.com',
      invitedByUserId: 'u1',
    })

    expect(result).toEqual(created)
    expect(prisma.invitation.updateMany).toHaveBeenCalledWith({
      where: {
        email: 'admin@acme.com',
        tenantId: 't1',
        role: 'TENANT_ADMIN',
        acceptedAt: null,
        revokedAt: null,
      },
      data: expect.objectContaining({ revokedAt: expect.any(Date) }),
    })

    expect(prisma.invitation.create).toHaveBeenCalledTimes(1)
    const createArgs = prisma.invitation.create.mock.calls[0][0]
    expect(createArgs.data.email).toBe('admin@acme.com')
    expect(typeof createArgs.data.tokenHash).toBe('string')
    expect(createArgs.data.tokenHash.length).toBeGreaterThanOrEqual(64)

    const notifierArgs = (notifier.notifyTenantAdminInvited as jest.Mock).mock
      .calls[0][0] as TenantAdminInvitationEmailContext
    expect(notifierArgs.recipientEmail).toBe('admin@acme.com')
    expect(notifierArgs.tenantName).toBe('Acme')
    expect(notifierArgs.rawToken.length).toBeGreaterThan(20)
  })

  it('rolls back the invitation when the email send fails', async () => {
    const created = {
      id: 'inv1',
      email: 'admin@acme.com',
      role: 'TENANT_ADMIN',
      tenantId: 't1',
      expiresAt: new Date(Date.now() + 24 * 3600_000),
    }
    const prisma = {
      tenant: { findFirst: jest.fn(async () => ({ id: 't1', name: 'Acme' })) },
      user: { findFirst: jest.fn(async () => null) },
      invitation: {
        updateMany: jest.fn(async () => ({ count: 0 })),
        create: jest.fn(async () => created),
        update: jest.fn(async () => undefined),
      },
    }
    const notifier = buildNotifier(jest.fn(async () => Promise.reject(new Error('SMTP down'))))
    const useCase = new InviteTenantAdminUseCase(
      prisma as unknown as PrismaClient,
      buildEnv(),
      notifier,
    )

    await expect(
      useCase.execute({ tenantId: 't1', email: 'admin@acme.com', invitedByUserId: 'u1' }),
    ).rejects.toThrow('SMTP down')

    expect(prisma.invitation.update).toHaveBeenCalledWith({
      where: { id: 'inv1' },
      data: expect.objectContaining({ revokedAt: expect.any(Date) }),
    })
  })
})
