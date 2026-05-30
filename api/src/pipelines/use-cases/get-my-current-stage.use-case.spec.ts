import { ForbiddenException, NotFoundException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { PipelineStageKind, UserRole } from '../../../generated/prisma/client'
import { GetMyCurrentStageUseCase } from './get-my-current-stage.use-case'

describe('GetMyCurrentStageUseCase', () => {
  const actor = { userId: 'u1', role: UserRole.CANDIDATE, tenantId: null }

  it('rejects non-candidates', async () => {
    const useCase = new GetMyCurrentStageUseCase({} as PrismaClient)
    await expect(
      useCase.execute({ userId: 'u1', role: UserRole.RECRUITER, tenantId: 't1' }, 'a1'),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws when application not found', async () => {
    const prisma = {
      application: { findFirst: jest.fn(async () => null) },
      applicationStageProgress: { findUnique: jest.fn() },
    }
    const useCase = new GetMyCurrentStageUseCase(prisma as unknown as PrismaClient)
    await expect(useCase.execute(actor, 'a1')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('returns current stage and progress', async () => {
    const prisma = {
      application: {
        findFirst: jest.fn(async () => ({
          id: 'a1',
          currentJobStageId: 's1',
          currentStage: {
            id: 's1',
            position: 0,
            kind: PipelineStageKind.MANUAL,
            name: 'Triagem',
            config: {},
            required: true,
          },
        })),
      },
      applicationStageProgress: {
        findUnique: jest.fn(async () => ({ id: 'p1', status: 'PENDING' })),
      },
    }
    const useCase = new GetMyCurrentStageUseCase(prisma as unknown as PrismaClient)
    const result = await useCase.execute(actor, 'a1')
    expect(result.applicationId).toBe('a1')
    expect(result.stage?.name).toBe('Triagem')
    expect(result.progress?.status).toBe('PENDING')
  })
})
