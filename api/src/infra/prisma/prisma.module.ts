import { Global, Module } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { EnvService } from '../env/env.service'
import { PRISMA_CLIENT } from './prisma.constants'
import { PrismaConnectionService } from './prisma-connection.service'
import { tenantPrismaExtension } from './tenant-prisma.extension'

@Global()
@Module({
  providers: [
    {
      provide: PRISMA_CLIENT,
      inject: [TenantContextService, EnvService],
      useFactory: (tenantContext: TenantContextService, env: EnvService): PrismaClient => {
        const adapter = new PrismaPg({
          connectionString: env.databaseUrl,
        })
        const prisma = new PrismaClient({ adapter }).$extends(tenantPrismaExtension(tenantContext))
        return prisma as unknown as PrismaClient
      },
    },
    PrismaConnectionService,
  ],
  exports: [PRISMA_CLIENT],
})
export class PrismaModule {}
