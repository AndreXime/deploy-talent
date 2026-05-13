import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { EnvService } from '../../infra/env/env.service'
import { InvitationEmailNotifier } from '../../invitations/invitation-email.notifier'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { SourceCandidateUseCase } from './source-candidate.use-case'

function buildEnv(): EnvService {
  return {
    webBaseUrl: 'https://app.example.com',
    invitationTtlHours: 48,
  } as unknown as EnvService
}

function buildNotifier() {
  return {
    notifyCandidateSourcedForJob: jest.fn(async () => undefined),
    notifyCandidateNudgedForJob: jest.fn(async () => undefined),
  } as unknown as InvitationEmailNotifier
}

function buildPrisma(overrides: Record<string, unknown> = {}) {
  return {
    job: { findFirst: jest.fn() },
    user: { findFirst: jest.fn() },
    candidate: { findFirst: jest.fn() },
    application: { findFirst: jest.fn() },
    invitation: { updateMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    tenant: { findFirst: jest.fn(async () => ({ name: 'Acme' })) },
    ...overrides,
  } as unknown as PrismaClient
}

describe('SourceCandidateUseCase', () => {
  it('rejeita actor candidato', async () => {
    const prisma = buildPrisma()
    const tenantContext = { getTenantId: () => 't1' } as unknown as TenantContextService
    const useCase = new SourceCandidateUseCase(prisma, tenantContext, buildEnv(), buildNotifier())

    await expect(
      useCase.execute(
        { userId: 'u1', role: UserRole.CANDIDATE },
        { jobId: 'j1', candidateEmail: 'c@c.com', candidateName: 'C' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('lança NotFound quando a vaga não pertence ao tenant', async () => {
    const prisma = buildPrisma({ job: { findFirst: jest.fn(async () => null) } })
    const tenantContext = { getTenantId: () => 't1' } as unknown as TenantContextService
    const useCase = new SourceCandidateUseCase(prisma, tenantContext, buildEnv(), buildNotifier())

    await expect(
      useCase.execute(
        { userId: 'u1', role: UserRole.RECRUITER },
        { jobId: 'j1', candidateEmail: 'c@c.com', candidateName: 'C' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('cria convite CANDIDATE e envia email de sourcing quando o email é novo', async () => {
    const invitationCreate = jest.fn(async () => ({ id: 'inv1' }))
    const prisma = buildPrisma({
      job: {
        findFirst: jest.fn(async () => ({ id: 'j1', title: 'Eng Senior', tenantId: 't1' })),
      },
      user: { findFirst: jest.fn(async () => null) },
      invitation: {
        updateMany: jest.fn(async () => ({ count: 0 })),
        create: invitationCreate,
        update: jest.fn(),
      },
    })
    const tenantContext = { getTenantId: () => 't1' } as unknown as TenantContextService
    const notifier = buildNotifier()
    const useCase = new SourceCandidateUseCase(prisma, tenantContext, buildEnv(), notifier)

    const result = await useCase.execute(
      { userId: 'rec1', role: UserRole.RECRUITER },
      { jobId: 'j1', candidateEmail: 'New@C.com ', candidateName: ' Cândida ' },
    )

    expect(result).toEqual({ outcome: 'CANDIDATE_INVITED', invitationId: 'inv1' })
    expect(invitationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'new@c.com',
          name: 'Cândida',
          role: UserRole.CANDIDATE,
          tenantId: null,
          invitedByUserId: 'rec1',
        }),
      }),
    )
    expect(notifier.notifyCandidateSourcedForJob).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'new@c.com',
        recipientName: 'Cândida',
        tenantName: 'Acme',
        jobTitle: 'Eng Senior',
        jobUrl: 'https://app.example.com/carreiras/t1/vagas/j1',
      }),
    )
  })

  it('envia nudge com link da vaga quando o candidato existe mas ainda não se candidatou', async () => {
    const prisma = buildPrisma({
      job: {
        findFirst: jest.fn(async () => ({ id: 'j1', title: 'PM', tenantId: 't1' })),
      },
      user: { findFirst: jest.fn(async () => ({ id: 'u1', role: UserRole.CANDIDATE })) },
      candidate: { findFirst: jest.fn(async () => ({ id: 'cand1' })) },
      application: { findFirst: jest.fn(async () => null) },
    })
    const tenantContext = { getTenantId: () => 't1' } as unknown as TenantContextService
    const notifier = buildNotifier()
    const useCase = new SourceCandidateUseCase(prisma, tenantContext, buildEnv(), notifier)

    const result = await useCase.execute(
      { userId: 'rec1', role: UserRole.RECRUITER },
      { jobId: 'j1', candidateEmail: 'existing@c.com', candidateName: 'Existing' },
    )

    expect(result).toEqual({ outcome: 'JOB_LINK_SENT' })
    expect(notifier.notifyCandidateNudgedForJob).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'existing@c.com',
        tenantName: 'Acme',
        jobTitle: 'PM',
        jobUrl: 'https://app.example.com/carreiras/t1/vagas/j1',
      }),
    )
    expect(notifier.notifyCandidateSourcedForJob).not.toHaveBeenCalled()
  })

  it('devolve ALREADY_APPLIED e não dispara emails quando já existe candidatura', async () => {
    const prisma = buildPrisma({
      job: {
        findFirst: jest.fn(async () => ({ id: 'j1', title: 'PM', tenantId: 't1' })),
      },
      user: { findFirst: jest.fn(async () => ({ id: 'u1', role: UserRole.CANDIDATE })) },
      candidate: { findFirst: jest.fn(async () => ({ id: 'cand1' })) },
      application: { findFirst: jest.fn(async () => ({ id: 'app1' })) },
    })
    const tenantContext = { getTenantId: () => 't1' } as unknown as TenantContextService
    const notifier = buildNotifier()
    const useCase = new SourceCandidateUseCase(prisma, tenantContext, buildEnv(), notifier)

    const result = await useCase.execute(
      { userId: 'rec1', role: UserRole.RECRUITER },
      { jobId: 'j1', candidateEmail: 'existing@c.com', candidateName: 'Existing' },
    )

    expect(result).toEqual({ outcome: 'ALREADY_APPLIED', applicationId: 'app1' })
    expect(notifier.notifyCandidateNudgedForJob).not.toHaveBeenCalled()
    expect(notifier.notifyCandidateSourcedForJob).not.toHaveBeenCalled()
  })

  it('rejeita quando o email pertence a um usuário interno', async () => {
    const prisma = buildPrisma({
      job: {
        findFirst: jest.fn(async () => ({ id: 'j1', title: 'PM', tenantId: 't1' })),
      },
      user: { findFirst: jest.fn(async () => ({ id: 'u1', role: UserRole.RECRUITER })) },
    })
    const tenantContext = { getTenantId: () => 't1' } as unknown as TenantContextService
    const useCase = new SourceCandidateUseCase(prisma, tenantContext, buildEnv(), buildNotifier())

    await expect(
      useCase.execute(
        { userId: 'rec1', role: UserRole.RECRUITER },
        { jobId: 'j1', candidateEmail: 'rec@c.com', candidateName: 'X' },
      ),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('reverte o convite se o envio do email falhar', async () => {
    const invitationCreate = jest.fn(async () => ({ id: 'inv1' }))
    const invitationUpdate = jest.fn(async () => undefined)
    const prisma = buildPrisma({
      job: {
        findFirst: jest.fn(async () => ({ id: 'j1', title: 'PM', tenantId: 't1' })),
      },
      user: { findFirst: jest.fn(async () => null) },
      invitation: {
        updateMany: jest.fn(async () => ({ count: 0 })),
        create: invitationCreate,
        update: invitationUpdate,
      },
    })
    const tenantContext = { getTenantId: () => 't1' } as unknown as TenantContextService
    const notifier = {
      notifyCandidateSourcedForJob: jest.fn(async () => {
        throw new Error('smtp down')
      }),
      notifyCandidateNudgedForJob: jest.fn(),
    } as unknown as InvitationEmailNotifier
    const useCase = new SourceCandidateUseCase(prisma, tenantContext, buildEnv(), notifier)

    await expect(
      useCase.execute(
        { userId: 'rec1', role: UserRole.RECRUITER },
        { jobId: 'j1', candidateEmail: 'new@c.com', candidateName: 'New' },
      ),
    ).rejects.toThrow('smtp down')
    expect(invitationUpdate).toHaveBeenCalledWith({
      where: { id: 'inv1' },
      data: { revokedAt: expect.any(Date) },
    })
  })
})
