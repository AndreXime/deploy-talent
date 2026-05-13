import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { ApplicationStatus, type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { MoveApplicationStageUseCase } from './move-application-stage.use-case'

const ctx = { requireTenantId: () => 't1' } as unknown as TenantContextService

function buildPrisma(overrides: Record<string, unknown> = {}) {
  const tx = {
    application: { update: jest.fn(async () => undefined) },
    applicationStageProgress: {
      upsert: jest.fn(async () => ({ id: 'p1', status: 'PENDING' })),
    },
    applicationHistory: { create: jest.fn(async () => undefined) },
  }
  return {
    application: {
      findFirst: jest.fn(async () => ({
        id: 'a1',
        jobId: 'j1',
        status: ApplicationStatus.APPLIED,
        currentJobStageId: null,
        currentStage: null,
      })),
    },
    jobStage: {
      findUnique: jest.fn(async () => ({ id: 'st1', jobId: 'j1', name: 'Triagem' })),
    },
    applicationStageProgress: { findUniqueOrThrow: jest.fn() },
    $transaction: jest.fn(async (cb: (tx: typeof tx) => Promise<unknown>) => cb(tx)),
    __tx: tx,
    ...overrides,
  } as unknown as PrismaClient & { __tx: typeof tx }
}

describe('MoveApplicationStageUseCase', () => {
  it('rejeita actor não recrutador', async () => {
    const uc = new MoveApplicationStageUseCase(buildPrisma(), ctx)
    await expect(
      uc.execute(
        { userId: 'u', role: UserRole.CANDIDATE },
        { applicationId: 'a1', jobStageId: 'st1' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('rejeita candidatura inexistente', async () => {
    const prisma = buildPrisma({ application: { findFirst: jest.fn(async () => null) } })
    const uc = new MoveApplicationStageUseCase(prisma, ctx)
    await expect(
      uc.execute(
        { userId: 'u', role: UserRole.RECRUITER },
        { applicationId: 'a1', jobStageId: 'st1' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejeita stage de outra vaga', async () => {
    const prisma = buildPrisma({
      jobStage: {
        findUnique: jest.fn(async () => ({ id: 'st1', jobId: 'jOther', name: 'X' })),
      },
    })
    const uc = new MoveApplicationStageUseCase(prisma, ctx)
    await expect(
      uc.execute(
        { userId: 'u', role: UserRole.RECRUITER },
        { applicationId: 'a1', jobStageId: 'st1' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('movimenta APPLIED para IN_PROGRESS e grava snapshot do nome', async () => {
    const prisma = buildPrisma()
    const uc = new MoveApplicationStageUseCase(prisma, ctx)

    await uc.execute(
      { userId: 'rec1', role: UserRole.RECRUITER },
      { applicationId: 'a1', jobStageId: 'st1' },
    )

    const tx = (prisma as unknown as { __tx: ReturnType<typeof buildPrisma>['__tx'] }).__tx
    expect(tx.application.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: expect.objectContaining({
        currentJobStageId: 'st1',
        status: ApplicationStatus.IN_PROGRESS,
      }),
    })
    expect(tx.applicationHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fromStage: null,
        toStage: 'Triagem',
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.IN_PROGRESS,
      }),
    })
  })
})
