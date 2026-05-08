import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

@Controller()
@ApiTags('Health')
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ description: 'Texto curto indicando que a API está no ar', schema: { type: 'string', example: 'Hello World!' } })
  getHello(): string {
    return 'Hello World!'
  }
}
