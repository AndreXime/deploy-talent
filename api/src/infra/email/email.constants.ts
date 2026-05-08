export const EMAIL_CHARSET = 'UTF-8'

const EMAIL_PATTERN =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$|^.+ <[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}>$/

export function isValidEmailAddress(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

export function normalizeRecipients(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  const list = Array.isArray(value) ? value : [value]
  const cleaned: string[] = []
  for (const raw of list) {
    const trimmed = raw.trim()
    if (trimmed.length === 0) continue
    if (!isValidEmailAddress(trimmed)) {
      throw new Error(`Invalid email address: "${raw}"`)
    }
    cleaned.push(trimmed)
  }
  return cleaned
}
