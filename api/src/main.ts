import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { setupDocs } from './infra/docs/setup-docs'
import { EnvService } from './infra/env/env.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const env = app.get(EnvService)

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  app.useGlobalFilters(new AllExceptionsFilter())

  setupDocs(app, env)

  await app.listen(env.port)
}
bootstrap()
