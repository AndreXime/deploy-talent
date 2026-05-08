import type { INestApplication } from '@nestjs/common'
import { SwaggerModule } from '@nestjs/swagger'
import type { EnvService } from '../env/env.service'
import { buildOpenApiConfig } from './index'

export function setupDocs(app: INestApplication, env: EnvService) {
  if (env.envMode === 'PROD') return

  const openApiDocument = SwaggerModule.createDocument(app, buildOpenApiConfig(), {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  })

  SwaggerModule.setup('docs', app, openApiDocument, {
    jsonDocumentUrl: 'docs-json',
  })
}

