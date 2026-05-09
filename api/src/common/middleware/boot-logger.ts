import { ConsoleLogger } from '@nestjs/common'

export class BootLogger extends ConsoleLogger {
  private silentContexts = [
    'NestFactory',
    'InstanceLoader',
    'RoutesResolver',
    'RouterExplorer',
    'NestApplication',
  ]

  log(message: unknown, context?: string) {
    if (this.silentContexts.includes(context || '')) {
      return
    }
    super.log(message, context)
  }
}
