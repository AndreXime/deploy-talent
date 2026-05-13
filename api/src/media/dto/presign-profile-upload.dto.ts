import { IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator'
import { ProfileMediaUploadPurpose } from './profile-media-upload-purpose'

export class PresignProfileUploadDto {
  @IsEnum(ProfileMediaUploadPurpose)
  purpose!: ProfileMediaUploadPurpose

  @IsString()
  @IsNotEmpty()
  contentType!: string

  @ValidateIf(
    (o) =>
      o.purpose === ProfileMediaUploadPurpose.CANDIDATE_RESUME ||
      o.purpose === ProfileMediaUploadPurpose.APPLICATION_STAGE_FILE,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fileName?: string

  @ValidateIf((o) => o.purpose === ProfileMediaUploadPurpose.APPLICATION_STAGE_FILE)
  @IsUUID()
  applicationId?: string
}

export { ProfileMediaUploadPurpose } from './profile-media-upload-purpose'
