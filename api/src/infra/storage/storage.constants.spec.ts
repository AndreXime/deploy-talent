import { buildStorageKey, parseStorageKey, sanitizeFileName } from './storage.constants'

describe('storage.constants', () => {
  it('sanitizes file names removing unsafe chars', () => {
    expect(sanitizeFileName('cv final 2024.pdf')).toBe('cv_final_2024.pdf')
    expect(sanitizeFileName('  ../etc/passwd  ')).toBe('.._etc_passwd')
    expect(sanitizeFileName('')).toBe('file')
  })

  it('builds candidate keys with the canonical prefix', () => {
    const key = buildStorageKey({
      scope: 'CANDIDATE',
      ownerId: '8e4d4f29-1111-2222-3333-444444444444',
      namespace: 'resumes',
      fileName: 'cv.pdf',
      uniqueId: 'abc',
    })
    expect(key).toBe('candidates/8e4d4f29-1111-2222-3333-444444444444/resumes/abc-cv.pdf')
  })

  it('builds tenant keys with the canonical prefix', () => {
    const key = buildStorageKey({
      scope: 'TENANT',
      ownerId: '8e4d4f29-1111-2222-3333-444444444444',
      namespace: 'branding',
      fileName: 'logo.png',
      uniqueId: 'xyz',
    })
    expect(key).toBe('tenants/8e4d4f29-1111-2222-3333-444444444444/branding/xyz-logo.png')
  })

  it('parses keys back to scope/owner/namespace', () => {
    const parsed = parseStorageKey(
      'candidates/8e4d4f29-1111-2222-3333-444444444444/resumes/abc-cv.pdf',
    )
    expect(parsed).toEqual({
      scope: 'CANDIDATE',
      ownerId: '8e4d4f29-1111-2222-3333-444444444444',
      namespace: 'resumes',
    })
  })

  it('rejects malformed or unknown keys', () => {
    expect(parseStorageKey('../etc/passwd')).toBeNull()
    expect(parseStorageKey('candidates/not-a-uuid/resumes/x.pdf')).toBeNull()
    expect(
      parseStorageKey('candidates/8e4d4f29-1111-2222-3333-444444444444/unknown-ns/x.pdf'),
    ).toBeNull()
  })
})
