import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export class UpdateEvaluationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  score?: number | null

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null
}
