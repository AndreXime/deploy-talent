import { IsEnum, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator'
import { ProfileMediaUploadPurpose } from './profile-media-upload-purpose'

export class PresignProfileUploadDto {
  @IsEnum(ProfileMediaUploadPurpose)
  purpose!: ProfileMediaUploadPurpose

  @IsString()
  @IsNotEmpty()
  contentType!: string

  @ValidateIf((o) => o.purpose === ProfileMediaUploadPurpose.CANDIDATE_RESUME)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fileName?: string
}

export { ProfileMediaUploadPurpose } from './profile-media-upload-purpose'
