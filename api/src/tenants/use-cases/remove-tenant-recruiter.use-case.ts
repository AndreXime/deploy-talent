import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { type PrismaClient, UserRole } from '../../../generated/prisma/client'
import { PRISMA_CLIENT } from '../../infra/prisma/prisma.constants'
import { TenantContextService } from '../../tenant-context/tenant-context.service'

@Injectable()
export class RemoveTenantRecruiterUseCase {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(actorUserId: string, recruiterUserId: string): Promise<void> {
    const tenantId = this.tenantContext.requireTenantId()

    if (actorUserId === recruiterUserId) {
      throw new BadRequestException('Cannot remove your own account from the team')
    }

    const recruiter = await this.prisma.user.findFirst({
      where: { id: recruiterUserId },
      select: { id: true, role: true, tenantId: true },
    })
    if (!recruiter) throw new NotFoundException('Recruiter not found')

    if (recruiter.tenantId !== tenantId || recruiter.role !== UserRole.RECRUITER) {
      throw new ForbiddenException('User is not a recruiter of this tenant')
    }

    await this.prisma.user.delete({ where: { id: recruiter.id } })
  }
}
