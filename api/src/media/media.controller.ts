import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request as ExpressRequest } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { JwtPayload } from '../auth/jwt-payload'
import { PresignedUrlResponseDto } from '../infra/docs/dto/swagger-responses.dto'
import { ApiJwtAuth, ApiStandardErrors } from '../infra/docs/swagger-decorators'
import { TenantOptional } from '../tenant-context/tenant.decorators'
import { PresignProfileUploadDto } from './dto/presign-profile-upload.dto'
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
  constructor(private readonly presignProfileUpload: PresignProfileUploadUseCase) {}

  @Post('presign-upload')
  @ApiOperation({
    summary: 'URL pré-assinada para upload (avatar, currículo, logo, banner ou arquivo de etapa)',
    description:
      'Currículo: `purpose` `CANDIDATE_RESUME`, `contentType` PDF/DOC/DOCX e `fileName`. Após o PUT no S3, envie a `key` no `PATCH /candidates/me`. As leituras (`GET` perfil, candidaturas B2B) devolvem `resumeUrl` / `avatarUrl` já assinadas. Para etapa `FILE_UPLOAD` da pipeline: `purpose` `APPLICATION_STAGE_FILE`, `applicationId`, `fileName` e `contentType` um de PDF, DOCX, PNG, JPEG, TXT (definido pela API).',
  })
  @ApiBody({ type: PresignProfileUploadDto })
  @ApiCreatedResponse({ type: PresignedUrlResponseDto })
  async presignUpload(@Request() req: RequestWithJwt, @Body() body: PresignProfileUploadDto) {
    return this.presignProfileUpload.execute(req.user, body)
  }
}
