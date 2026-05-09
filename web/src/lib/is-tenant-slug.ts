const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Slug de tenant (ex.: criação na plataforma). */
export function isTenantSlug(value: string): boolean {
  return SLUG_RE.test(value.trim())
}
