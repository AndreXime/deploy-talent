import { isValidEmailAddress, normalizeRecipients } from './email.constants'

describe('email.constants', () => {
  it('accepts plain and named addresses', () => {
    expect(isValidEmailAddress('user@example.com')).toBe(true)
    expect(isValidEmailAddress('Deploy Talent <noreply@deploytalent.com>')).toBe(true)
  })

  it('rejects malformed addresses', () => {
    expect(isValidEmailAddress('user@')).toBe(false)
    expect(isValidEmailAddress('not-an-email')).toBe(false)
    expect(isValidEmailAddress('@example.com')).toBe(false)
  })

  it('normalizes single recipient into array', () => {
    expect(normalizeRecipients('a@b.com')).toEqual(['a@b.com'])
  })

  it('drops empty entries and trims', () => {
    expect(normalizeRecipients(['  a@b.com  ', '', '   '])).toEqual(['a@b.com'])
  })

  it('returns empty array when undefined', () => {
    expect(normalizeRecipients(undefined)).toEqual([])
  })

  it('throws on invalid recipient', () => {
    expect(() => normalizeRecipients(['valid@x.com', 'broken'])).toThrow(/Invalid email/)
  })
})
