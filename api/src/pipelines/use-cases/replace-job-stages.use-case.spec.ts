import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { JobStatus, PipelineStageKind, type PrismaClient } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { type JobStageView, ListJobStagesUseCase } from './list-job-stages.use-case'
import { ReplaceJobStagesUseCase } from './replace-job-stages.use-case'

function buildPrisma(overrides: Record<string, unknown> = {}) {
  const tx = {
    jobStage: {
      deleteMany: jest.fn(async () => ({ count: 0 })),
      createMany: jest.fn(async () => ({ count: 0 })),
    },
  }
  return {
    job: { findUnique: jest.fn(async () => ({ tenantId: 't1', status: JobStatus.DRAFT })) },
    $transaction: jest.fn(async (cb: (tx: typeof tx) => Promise<unknown>) => cb(tx)),
    __tx: tx,
    ...overrides,
  } as unknown as PrismaClient & { __tx: typeof tx }
}

function buildList(view: JobStageView[] = []) {
  return { execute: jest.fn(async () => view) } as unknown as ListJobStagesUseCase
}

const ctx = { requireTenantId: () => 't1' } as unknown as TenantContextService

describe('ReplaceJobStagesUseCase', () => {
  it('falha sem etapas', async () => {
    const uc = new ReplaceJobStagesUseCase(buildPrisma(), ctx, buildList())
    await expect(uc.execute('j1', { stages: [] })).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejeita vaga inexistente', async () => {
    const prisma = buildPrisma({ job: { findUnique: jest.fn(async () => null) } })
    const uc = new ReplaceJobStagesUseCase(prisma, ctx, buildList())
    await expect(
      uc.execute('j1', { stages: [{ kind: PipelineStageKind.MANUAL, name: 'X' }] }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejeita vaga de outro tenant', async () => {
    const prisma = buildPrisma({
      job: { findUnique: jest.fn(async () => ({ tenantId: 'other', status: JobStatus.DRAFT })) },
    })
    const uc = new ReplaceJobStagesUseCase(prisma, ctx, buildList())
    await expect(
      uc.execute('j1', { stages: [{ kind: PipelineStageKind.MANUAL, name: 'X' }] }),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('rejeita vagas fora de DRAFT', async () => {
    const prisma = buildPrisma({
      job: { findUnique: jest.fn(async () => ({ tenantId: 't1', status: JobStatus.PUBLISHED })) },
    })
    const uc = new ReplaceJobStagesUseCase(prisma, ctx, buildList())
    await expect(
      uc.execute('j1', { stages: [{ kind: PipelineStageKind.MANUAL, name: 'X' }] }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('persiste etapas numeradas a partir de zero', async () => {
    const prisma = buildPrisma()
    const list = buildList()
    const uc = new ReplaceJobStagesUseCase(prisma, ctx, list)

    await uc.execute('j1', {
      stages: [
        { kind: PipelineStageKind.MANUAL, name: 'Triagem' },
        { kind: PipelineStageKind.MANUAL, name: 'Decisão' },
      ],
    })

    const tx = (prisma as unknown as { __tx: { jobStage: { createMany: jest.Mock } } }).__tx
    expect(tx.jobStage.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ jobId: 'j1', position: 0, name: 'Triagem' }),
        expect.objectContaining({ jobId: 'j1', position: 1, name: 'Decisão' }),
      ],
    })
  })
})
