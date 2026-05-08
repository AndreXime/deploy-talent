import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { JobStatus } from '../../../generated/prisma/client'

export class CreateJobDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string

  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  description!: string

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  modality!: string

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  location!: string

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  seniority!: string

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus
}
