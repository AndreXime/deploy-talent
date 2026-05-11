import { ForbiddenException } from '@nestjs/common'
import type { PrismaClient } from '../../../generated/prisma/client'
import { CandidateProfileReadService } from '../candidate-profile-read.service'
import { ForgetMeUseCase } from './forget-me.use-case'

describe('ForgetMeUseCase', () => {
  it('forgetMe rejects already anonymized profile', async () => {
    const prisma = {
      candidate: {
        findFirst: jest.fn(async () => ({ id: 'c1', email: 'deleted+c1@anon.invalid' })),
        update: jest.fn(),
      },
    }
    const storage = { deleteObject: jest.fn(async () => undefined) }
    const candidateRead = { toApiRead: jest.fn() }
    const useCase = new ForgetMeUseCase(
      prisma as unknown as PrismaClient,
      storage as never,
      candidateRead as unknown as CandidateProfileReadService,
    )

    await expect(useCase.execute('u1')).rejects.toBeInstanceOf(ForbiddenException)
  })
})

