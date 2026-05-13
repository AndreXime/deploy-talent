import { addJwtExpiresStringToDate } from './jwt-expires-in'

describe('addJwtExpiresStringToDate', () => {
  const base = new Date('2026-01-01T12:00:00.000Z')

  it('parseia minutos e horas', () => {
    expect(addJwtExpiresStringToDate(base, '10m').toISOString()).toBe('2026-01-01T12:10:00.000Z')
    expect(addJwtExpiresStringToDate(base, '24h').toISOString()).toBe('2026-01-02T12:00:00.000Z')
  })

  it('aceita segundos só com dígitos', () => {
    expect(addJwtExpiresStringToDate(base, '900').toISOString()).toBe('2026-01-01T12:15:00.000Z')
  })

  it('rejeita formato inválido', () => {
    expect(() => addJwtExpiresStringToDate(base, 'x')).toThrow('Invalid JWT expires string')
  })
})
