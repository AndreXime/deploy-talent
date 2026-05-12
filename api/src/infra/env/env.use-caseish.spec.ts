import { ConfigService } from '@nestjs/config'
import { EnvService } from './env.service'

function createConfig(values: Record<string, string | undefined>) {
  return {
    get: (key: string) => values[key],
  } satisfies Pick<ConfigService, 'get'>
}

describe('EnvService', () => {
  it('requires ENV_MODE', () => {
    const env = new EnvService(createConfig({}) as ConfigService)
    expect(() => env.envMode).toThrow('Missing ENV_MODE')
  })

  it('validates ENV_MODE values', () => {
    const env = new EnvService(createConfig({ ENV_MODE: 'STAGING' }) as ConfigService)
    expect(() => env.envMode).toThrow('Invalid ENV_MODE')
  })

  it('parses PORT', () => {
    const env = new EnvService(createConfig({ ENV_MODE: 'TEST', PORT: '3001' }) as ConfigService)
    expect(env.port).toBe(3001)
  })
})
