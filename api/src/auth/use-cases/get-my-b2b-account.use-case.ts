import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { StorageService } from '../../infra/storage/storage.service'

@Injectable()
export class GetMyB2BAccountUseCase {
  private readonly logger = new Logger(GetMyB2BAccountUseCase.name)

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly storage: StorageService,
  ) {}

  async execute(userId: string, role: UserRole) {
    if (role !== UserRole.TENANT_ADMIN && role !== UserRole.RECRUITER) {
      throw new ForbiddenException('Only tenant users have a B2B account')
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        tenantId: true,
        role: true,
        avatarKey: true,
      },
    })
    if (!user) throw new NotFoundException('User not found')

    const avatarUrl = user.avatarKey ? await this.signKey(user.avatarKey) : null

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      avatarUrl,
    }
  }

  private async signKey(key: string): Promise<string | null> {
    try {
      const signed = await this.storage.presignDownload({ key })
      return signed.url
    } catch (err) {
      this.logger.warn('Falha ao gerar URL assinada para avatar', err as Error)
      return null
    }
  }
}
