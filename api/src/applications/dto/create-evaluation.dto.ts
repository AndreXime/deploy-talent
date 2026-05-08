import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator'

export class CreateEvaluationDto {
  @IsUUID()
  applicationId!: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  score?: number

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string
}
