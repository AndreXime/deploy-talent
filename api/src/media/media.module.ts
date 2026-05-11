import { Module } from '@nestjs/common'
import { MediaController } from './media.controller'
import { TenantBrandingPublicController } from './tenant-branding-public.controller'
import { GetPublicTenantBrandingUseCase } from './use-cases/get-public-tenant-branding.use-case'
import { PresignProfileUploadUseCase } from './use-cases/presign-profile-upload.use-case'

@Module({
  controllers: [MediaController, TenantBrandingPublicController],
  providers: [PresignProfileUploadUseCase, GetPublicTenantBrandingUseCase],
})
export class MediaModule {}
