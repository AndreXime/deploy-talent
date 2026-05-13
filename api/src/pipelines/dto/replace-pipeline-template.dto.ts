import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { PipelineStageKind } from '../../../generated/prisma/client'

export class PipelineStageInputDto {
  @IsEnum(PipelineStageKind)
  kind!: PipelineStageKind

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>

  @IsOptional()
  @IsBoolean()
  required?: boolean
}

export class ReplacePipelineTemplateDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PipelineStageInputDto)
  stages!: PipelineStageInputDto[]
}
