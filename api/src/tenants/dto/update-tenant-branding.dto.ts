import { IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateTenantBrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(512)
  logoKey?: string

  @IsOptional()
  @IsString()
  @MaxLength(512)
  bannerKey?: string
}
