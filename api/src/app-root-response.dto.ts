import { ApiProperty } from '@nestjs/swagger'

export class AppRootResponseDto {
  @ApiProperty({ example: 'Deploy Talent API' })
  name!: string

  @ApiProperty({ example: '0.0.1', description: 'Versão do pacote da API (`package.json`)' })
  version!: string

  @ApiProperty({ example: 'ok', description: 'Estado rápido do processo HTTP' })
  status!: string

  @ApiProperty({
    description: 'Instante UTC em que a resposta foi gerada',
    example: '2026-05-15T14:22:31.582Z',
  })
  timestamp!: string

  @ApiProperty({
    description: 'Tempo de execução do processo Node.js em segundos',
    example: 3621.742,
  })
  uptimeSeconds!: number
}
