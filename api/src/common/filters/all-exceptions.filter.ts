import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import type { Request, Response } from 'express'

interface ErrorBody {
  statusCode: number
  error: string
  message: string
  path: string
  timestamp: string
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const { status, error, message } = this.normalize(exception)
    const body: ErrorBody = {
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    }

    response.status(status).json(body)
  }

  private normalize(exception: unknown): {
    status: number
    error: string
    message: string
  } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse()
      const message =
        typeof res === 'string'
          ? res
          : ((res as { message?: unknown }).message ?? exception.message ?? 'Request failed')
      return {
        status: exception.getStatus(),
        error: exception.name,
        message: Array.isArray(message) ? message.join('; ') : String(message),
      }
    }

    if (
      exception instanceof Error &&
      'code' in exception &&
      typeof (exception as { code: unknown }).code === 'string'
    ) {
      const code = (exception as { code: string }).code
      return {
        status: HttpStatus.CONFLICT,
        error: code,
        message: exception.message,
      }
    }

    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: exception.name,
        message: exception.message,
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'UnknownError',
      message: 'Unexpected error',
    }
  }
}
