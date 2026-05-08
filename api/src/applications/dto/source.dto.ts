import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator'

export class SourceDto {
  @IsUUID()
  jobId!: string

  @IsEmail()
  candidateEmail!: string

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  candidateName!: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  stage?: string
}
