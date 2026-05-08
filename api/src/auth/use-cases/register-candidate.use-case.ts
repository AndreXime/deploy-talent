import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { LoginUseCase } from './login.use-case'

@Injectable()
export class RegisterCandidateUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly login: LoginUseCase,
  ) {}

  async execute(input: { email: string; password: string; name: string }) {
    const existing = await this.prisma.user.findFirst({ where: { email: input.email } })
    if (existing) throw new BadRequestException('Email already in use')

    const passwordHash = await bcrypt.hash(input.password, 10)

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: UserRole.CANDIDATE,
      },
    })

    await this.prisma.candidate.create({
      data: {
        userId: user.id,
        name: input.name,
        email: input.email,
      },
    })

    return this.login.execute(user)
  }
}

