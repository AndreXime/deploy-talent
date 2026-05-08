import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common'
import type { Request as ExpressRequest } from 'express'
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'
import type { JwtPayload } from '../auth/jwt-payload'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PresignedUrlResponseDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtAuth, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional } from '../tenant-context/tenant.decorators'
import { PresignAssetDownloadDto } from './dto/presign-asset-download.dto'
import { PresignProfileUploadDto } from './dto/presign-profile-upload.dto'
import { PresignAssetDownloadUseCase } from './use-cases/presign-asset-download.use-case'
import { PresignProfileUploadUseCase } from './use-cases/presign-profile-upload.use-case'

interface RequestWithJwt extends ExpressRequest {
  user: JwtPayload
}

@Controller('media')
@ApiTags('Media')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
@ApiStandardErrors(true)
@TenantOptional()
export class MediaController {
  constructor(
    private readonly presignProfileUpload: PresignProfileUploadUseCase,
    private readonly presignAssetDownload: PresignAssetDownloadUseCase,
  ) {}

  @Post('presign-upload')
  @ApiOperation({
    summary: 'URL pré-assinada para upload (avatar, logo ou banner)',
    description:
      'Após o PUT no S3, grave a `key` devolvida no perfil (`PATCH candidates/me`, `PATCH auth/me/avatar`, `PATCH tenants/current/branding`).',
  })
  @ApiBody({ type: PresignProfileUploadDto })
  @ApiCreatedResponse({ type: PresignedUrlResponseDto })
  async presignUpload(@Request() req: RequestWithJwt, @Body() body: PresignProfileUploadDto) {
    return this.presignProfileUpload.execute(req.user, body)
  }

  @Post('presign-download')
  @ApiOperation({
    summary: 'URL pré-assinada para leitura de um objeto autorizado',
    description:
      'Permite baixar/visualizar mídia cujo prefixo da `key` corresponde ao seu papel (próprio avatar, branding do tenant ou candidato ligado ao tenant).',
  })
  @ApiBody({ type: PresignAssetDownloadDto })
  @ApiCreatedResponse({ type: PresignedUrlResponseDto })
  async presignDownload(@Request() req: RequestWithJwt, @Body() body: PresignAssetDownloadDto) {
    return this.presignAssetDownload.execute(req.user, body.key)
  }
}
