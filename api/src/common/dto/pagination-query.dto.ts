import { Type } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20
}

export interface PaginationResult {
  page: number
  limit: number
  skip: number
  take: number
}

export function resolvePagination(page?: number, limit?: number): PaginationResult {
  const p = page ?? 1
  const l = Math.min(limit ?? 20, 100)
  return {
    page: p,
    limit: l,
    skip: (p - 1) * l,
    take: l,
  }
}
