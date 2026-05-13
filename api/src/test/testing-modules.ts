import { Global, Module } from '@nestjs/common'
import { PRISMA_CLIENT } from '../infra/prisma/prisma.constants'

/** Módulo Nest para testes com `PRISMA_CLIENT` mockado. */
export function createTestPrismaModuleWithMock(prisma: unknown) {
  @Global()
  @Module({
    providers: [{ provide: PRISMA_CLIENT, useValue: prisma }],
    exports: [PRISMA_CLIENT],
  })
  class TestPrismaMockModule {}

  return TestPrismaMockModule
}
