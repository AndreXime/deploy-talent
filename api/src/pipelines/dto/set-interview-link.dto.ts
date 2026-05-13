import { IsISO8601, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator'

export class SetInterviewLinkDto {
  @IsString()
  @IsUrl()
  @MaxLength(500)
  url!: string

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string
}
