import { IsEnum, IsIn, IsNotEmpty, IsString } from 'class-validator'
import type { ProfileImageContentType } from '../media-key.util'
import { ProfileMediaUploadPurpose } from './profile-media-upload-purpose'

export class PresignProfileUploadDto {
  @IsEnum(ProfileMediaUploadPurpose)
  purpose!: ProfileMediaUploadPurpose

  @IsString()
  @IsNotEmpty()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: ProfileImageContentType
}

export { ProfileMediaUploadPurpose } from './profile-media-upload-purpose'
