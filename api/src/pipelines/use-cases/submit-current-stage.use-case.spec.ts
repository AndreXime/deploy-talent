import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import {
  ApplicationStatus,
  PipelineStageKind,
  type PrismaClient,
  UserRole,
} from '../../../generated/prisma/client'
import type { EnvService } from '../../infra/env/env.service'
import { SubmitCurrentStageUseCase } from './submit-current-stage.use-case'

function mockEnv(): EnvService {
  return { s3MaxUploadBytes: 10 * 1024 * 1024 } as unknown as EnvService
}

function buildPrisma(overrides: Record<string, unknown> = {}) {
  return {
    application: { findFirst: jest.fn() },
    applicationStageProgress: { upsert: jest.fn() },
    ...overrides,
  } as unknown as PrismaClient
}

describe('SubmitCurrentStageUseCase', () => {
  it('rejeita actor não candidato', async () => {
    const uc = new SubmitCurrentStageUseCase(buildPrisma(), mockEnv())
    await expect(
      uc.execute({ userId: 'u', role: UserRole.RECRUITER }, 'a1', {}),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('rejeita candidatura inexistente', async () => {
    const prisma = buildPrisma({ application: { findFirst: jest.fn(async () => null) } })
    const uc = new SubmitCurrentStageUseCase(prisma, mockEnv())
    await expect(
      uc.execute({ userId: 'u', role: UserRole.CANDIDATE }, 'a1', {}),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejeita candidatura terminada', async () => {
    const prisma = buildPrisma({
      application: {
        findFirst: jest.fn(async () => ({
          id: 'a1',
          status: ApplicationStatus.HIRED,
          currentJobStageId: 'st1',
          currentStage: { kind: PipelineStageKind.MANUAL, config: {} },
        })),
      },
    })
    const uc = new SubmitCurrentStageUseCase(prisma, mockEnv())
    await expect(
      uc.execute({ userId: 'u', role: UserRole.CANDIDATE }, 'a1', {}),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('valida questionário e marca progresso completo', async () => {
    const upsert = jest.fn(async () => ({ id: 'p1', status: 'COMPLETED' }))
    const prisma = buildPrisma({
      application: {
        findFirst: jest.fn(async () => ({
          id: 'a1',
          status: ApplicationStatus.IN_PROGRESS,
          currentJobStageId: 'st1',
          currentStage: {
            kind: PipelineStageKind.QUESTIONNAIRE,
            config: {
              questions: [{ id: 'q1', label: 'Nome', type: 'TEXT_SHORT', required: true }],
            },
          },
        })),
      },
      applicationStageProgress: { upsert },
    })
    const uc = new SubmitCurrentStageUseCase(prisma, mockEnv())

    await uc.execute({ userId: 'c1', role: UserRole.CANDIDATE }, 'a1', {
      answers: [{ questionId: 'q1', value: 'A' }],
    })

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          applicationId_jobStageId: { applicationId: 'a1', jobStageId: 'st1' },
        },
        update: expect.objectContaining({
          status: 'COMPLETED',
          completedByUserId: 'c1',
        }),
      }),
    )
  })

  it('rejeita submissão sem etapa atual', async () => {
    const prisma = buildPrisma({
      application: {
        findFirst: jest.fn(async () => ({
          id: 'a1',
          status: ApplicationStatus.APPLIED,
          currentJobStageId: null,
          currentStage: null,
        })),
      },
    })
    const uc = new SubmitCurrentStageUseCase(prisma, mockEnv())
    await expect(
      uc.execute({ userId: 'u', role: UserRole.CANDIDATE }, 'a1', {}),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
