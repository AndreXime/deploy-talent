/**
 * Converte o mesmo formato aceite por `jsonwebtoken` / Nest `expiresIn` num
 * instante absoluto (ex.: `10m`, `24h`, `7d`, ou segundos como string `900`).
 */
export function addJwtExpiresStringToDate(from: Date, expiresIn: string): Date {
  const s = expiresIn.trim().toLowerCase()
  if (/^\d+$/.test(s)) {
    const sec = Number.parseInt(s, 10)
    if (sec > 0) return new Date(from.getTime() + sec * 1000)
  }
  const m = /^(\d+)\s*([smhd])$/i.exec(s)
  if (m) {
    const n = Number.parseInt(m[1], 10)
    const unit = m[2].toLowerCase()
    const mult =
      unit === 's'
        ? 1000
        : unit === 'm'
          ? 60_000
          : unit === 'h'
            ? 3_600_000
            : unit === 'd'
              ? 86_400_000
              : 0
    if (n > 0 && mult > 0) return new Date(from.getTime() + n * mult)
  }
  throw new Error(`Invalid JWT expires string: ${expiresIn}`)
}
