import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MinLength } from 'class-validator'

export class LogoutDto {
  @ApiPropertyOptional({
    description:
      'Refresh opaco da sessão atual. Se omitido, revoga todos os refresh tokens ativos deste usuário.',
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  refresh_token?: string
}
