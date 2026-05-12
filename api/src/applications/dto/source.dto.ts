import { IsEmail, IsString, IsUUID, MaxLength, MinLength } from 'class-validator'

export class SourceDto {
  @IsUUID()
  jobId!: string

  @IsEmail()
  @MaxLength(254)
  candidateEmail!: string

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  candidateName!: string
}
