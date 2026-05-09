import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'

/** Explorar vagas em toda a plataforma (tenant ativo); filtros opcionais. */
export class MarketplaceJobListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(280)
  q?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  modality?: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  location?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  seniority?: string

  @IsOptional()
  @IsUUID()
  tenantId?: string
}
