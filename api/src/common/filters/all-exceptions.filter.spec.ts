import type { ArgumentsHost } from '@nestjs/common'
import { BadRequestException, HttpStatus } from '@nestjs/common'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client.js'
import { AllExceptionsFilter } from './all-exceptions.filter'

describe('AllExceptionsFilter', () => {
  function catchWithMocks(exception: unknown): {
    statusCode: number
    statusCalls: number[]
    jsonBody: unknown
  } {
    const filter = new AllExceptionsFilter()
    const statusCalls: number[] = []
    let jsonBody: unknown

    const mockResponse = {
      status(code: number) {
        statusCalls.push(code)
        return this
      },
      json(body: unknown) {
        jsonBody = body
      },
    }

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({ url: '/test' }),
      }),
    }

    filter.catch(exception, mockHost as unknown as ArgumentsHost)

    const body = jsonBody as { statusCode: number }

    return {
      statusCode: body.statusCode,
      statusCalls,
      jsonBody,
    }
  }

  it('returns HttpException shape', () => {
    const { statusCode } = catchWithMocks(new BadRequestException('Invalid'))
    expect(statusCode).toBe(HttpStatus.BAD_REQUEST)
  })

  it('does not map Node errno-style errors to 409', () => {
    const err = Object.assign(new Error('No such file'), { code: 'ENOENT' })
    const { statusCode } = catchWithMocks(err)
    expect(statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
  })

  it('maps Prisma P2025 to 404', () => {
    const err = new PrismaClientKnownRequestError('Record missing', {
      code: 'P2025',
      clientVersion: 'test',
    })
    const { statusCode } = catchWithMocks(err)
    expect(statusCode).toBe(HttpStatus.NOT_FOUND)
  })

  it('maps Prisma P2002 to 409', () => {
    const err = new PrismaClientKnownRequestError('Unique failed', {
      code: 'P2002',
      clientVersion: 'test',
    })
    const { statusCode } = catchWithMocks(err)
    expect(statusCode).toBe(HttpStatus.CONFLICT)
  })

  it('maps Prisma P2003 to 400', () => {
    const err = new PrismaClientKnownRequestError('FK failed', {
      code: 'P2003',
      clientVersion: 'test',
    })
    const { statusCode } = catchWithMocks(err)
    expect(statusCode).toBe(HttpStatus.BAD_REQUEST)
  })

  it('maps unmapped Prisma known codes to 500 with generic message', () => {
    const err = new PrismaClientKnownRequestError('Internal detail', {
      code: 'P1999',
      clientVersion: 'test',
    })
    const { statusCode, jsonBody } = catchWithMocks(err)
    expect(statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    expect((jsonBody as { message: string }).message).toBe('Database request failed.')
  })
})
