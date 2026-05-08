import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator'

export class CreateTenantDto {
  @IsString()
  @MaxLength(120)
  name!: string

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(80)
  slug!: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
