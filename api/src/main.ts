import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { setupDocs } from './infra/docs/setup-docs'
import { EnvService } from './infra/env/env.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const env = app.get(EnvService)

  app.use(
    env.envMode === 'PROD'
      ? helmet()
      : helmet({
          contentSecurityPolicy: false,
        }),
  )

  const corsOrigins = env.corsOrigins
  if (corsOrigins === true) {
    app.enableCors({ origin: true, credentials: true })
  } else if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins, credentials: true })
  }

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
