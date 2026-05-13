import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import type { PrismaClient, User } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { assertB2bTenantAllowsLogin } from '../b2b-tenant-session'

@Injectable()
export class ValidateLocalUserUseCase {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async execute(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    })
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) throw new UnauthorizedException('Invalid credentials')

    assertB2bTenantAllowsLogin(user, user.tenant)

    return user
  }
}
