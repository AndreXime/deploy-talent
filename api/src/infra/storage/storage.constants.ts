export const STORAGE_SCOPES = ['CANDIDATE', 'TENANT'] as const
export type StorageScope = (typeof STORAGE_SCOPES)[number]

export const STORAGE_NAMESPACES = ['resumes', 'avatars', 'attachments', 'branding'] as const
export type StorageNamespace = (typeof STORAGE_NAMESPACES)[number]

const SCOPE_TO_PREFIX: Record<StorageScope, string> = {
  CANDIDATE: 'candidates',
  TENANT: 'tenants',
}

const PREFIX_TO_SCOPE: Record<string, StorageScope> = {
  candidates: 'CANDIDATE',
  tenants: 'TENANT',
}

const FILENAME_REPLACEMENT = /[^a-zA-Z0-9._-]+/g

export function sanitizeFileName(name: string): string {
  const trimmed = name.trim().replace(FILENAME_REPLACEMENT, '_')
  if (trimmed.length === 0) return 'file'
  return trimmed.length > 120 ? trimmed.slice(0, 120) : trimmed
}

export function buildStorageKey(input: {
  scope: StorageScope
  ownerId: string
  namespace: StorageNamespace
  fileName: string
  uniqueId: string
}): string {
  const prefix = SCOPE_TO_PREFIX[input.scope]
  const safeName = sanitizeFileName(input.fileName)
  return `${prefix}/${input.ownerId}/${input.namespace}/${input.uniqueId}-${safeName}`
}

export interface ParsedStorageKey {
  scope: StorageScope
  ownerId: string
  namespace: StorageNamespace
}

const KEY_PATTERN = /^(candidates|tenants)\/([0-9a-fA-F-]{36})\/([a-z0-9-]+)\/[^/]+$/

export function parseStorageKey(key: string): ParsedStorageKey | null {
  const match = KEY_PATTERN.exec(key)
  if (!match) return null

  const [, prefix, ownerId, namespace] = match
  const scope = PREFIX_TO_SCOPE[prefix]
  if (!scope) return null
  if (!STORAGE_NAMESPACES.includes(namespace as StorageNamespace)) return null

  return { scope, ownerId, namespace: namespace as StorageNamespace }
}
