import { Inject, Injectable, Logger } from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { StorageService } from '../../infra/storage/storage.service'
import { TenantContextService } from '../../tenant-context/tenant-context.service'

export interface TenantRecruiterItem {
  id: string
  email: string
  avatarUrl: string | null
  createdAt: Date
}

@Injectable()
export class ListCurrentTenantRecruitersUseCase {
  private readonly logger = new Logger(ListCurrentTenantRecruitersUseCase.name)

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly storage: StorageService,
  ) {}

  async execute(): Promise<TenantRecruiterItem[]> {
    const tenantId = this.tenantContext.requireTenantId()

    const recruiters = await this.prisma.user.findMany({
      where: { tenantId, role: UserRole.RECRUITER },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        avatarKey: true,
        createdAt: true,
      },
    })

    return Promise.all(
      recruiters.map(async (user) => ({
        id: user.id,
        email: user.email,
        avatarUrl: user.avatarKey ? await this.signKey(user.avatarKey) : null,
        createdAt: user.createdAt,
      })),
    )
  }

  private async signKey(key: string): Promise<string | null> {
    try {
      const signed = await this.storage.presignDownload({ key })
      return signed.url
    } catch (err) {
      this.logger.warn('Falha ao gerar URL assinada para avatar de recrutador', err as Error)
      return null
    }
  }
}
