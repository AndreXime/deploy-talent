import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator'

export class UpdateCandidateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  phone?: string

  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatarKey?: string

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  resumeUrl?: string
}
