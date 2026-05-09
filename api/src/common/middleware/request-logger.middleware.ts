import { Logger } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'

const logger = new Logger('HTTP')

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint()
  const { method, originalUrl } = req
  let capturedResponseBody: unknown

  const originalSend = res.send.bind(res)
  res.send = function (
    this: Response,
    ...args: Parameters<Response['send']>
  ): ReturnType<Response['send']> {
    if (args.length > 0) {
      capturedResponseBody = args[0]
    }
    return originalSend.apply(this, args)
  }

  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    const { statusCode } = res

    const message = `${method} ${originalUrl} ${statusCode} - ${elapsedMs.toFixed(1)}ms`

    if (statusCode >= 500) {
      logger.error(`${message}\n${capturedResponseBody}`)
      return
    }
    if (statusCode >= 400) {
      logger.warn(`${message}\n${capturedResponseBody}`)
      return
    }
    logger.log(message)
  })

  next()
}
