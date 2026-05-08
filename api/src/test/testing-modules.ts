import { Global, Module } from '@nestjs/common'
import { PRISMA_CLIENT } from '../infra/prisma/prisma.constants'

@Global()
@Module({})
export class TestPrismaModule {
  static withMock(prisma: unknown) {
    @Global()
    @Module({
      providers: [{ provide: PRISMA_CLIENT, useValue: prisma }],
      exports: [PRISMA_CLIENT],
    })
    class TestPrismaMockModule {}

    return TestPrismaMockModule
  }
}

