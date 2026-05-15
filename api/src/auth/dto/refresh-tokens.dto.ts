import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MinLength } from 'class-validator'

export class RefreshTokensDto {
  @ApiPropertyOptional({
    description:
      'Opcional quando o navegador envia o mesmo refresh via cookie httpOnly (`credentials: include`).',
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  refresh_token?: string
}
