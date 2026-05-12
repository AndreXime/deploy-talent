import { BadRequestException } from '@nestjs/common'
import { parseStorageKey } from '../infra/storage/storage.constants'

export const PROFILE_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const RESUME_DOCUMENT_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export type ResumeDocumentContentType = (typeof RESUME_DOCUMENT_CONTENT_TYPES)[number]

export type ProfileImageContentType = (typeof PROFILE_IMAGE_CONTENT_TYPES)[number]

export function assertProfileImageContentType(
  value: string,
): asserts value is ProfileImageContentType {
  if (!PROFILE_IMAGE_CONTENT_TYPES.includes(value as ProfileImageContentType)) {
    throw new BadRequestException(
      `contentType must be one of: ${PROFILE_IMAGE_CONTENT_TYPES.join(', ')}`,
    )
  }
}

export function fileExtensionForContentType(contentType: ProfileImageContentType): string {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default: {
      const _exhaustive: never = contentType
      return _exhaustive
    }
  }
}

export function assertResumeDocumentContentType(
  value: string,
): asserts value is ResumeDocumentContentType {
  if (!RESUME_DOCUMENT_CONTENT_TYPES.includes(value as ResumeDocumentContentType)) {
    throw new BadRequestException(
      `contentType must be one of: ${RESUME_DOCUMENT_CONTENT_TYPES.join(', ')}`,
    )
  }
}

export function fileExtensionForResumeContentType(contentType: ResumeDocumentContentType): string {
  switch (contentType) {
    case 'application/pdf':
      return 'pdf'
    case 'application/msword':
      return 'doc'
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx'
    default: {
      const _exhaustive: never = contentType
      return _exhaustive
    }
  }
}

const RE_TENANT_LOGO = /^tenants\/([^/]+)\/logo\/[^/]+$/
const RE_TENANT_BANNER = /^tenants\/([^/]+)\/banner\/[^/]+$/
const RE_TENANT_USER_AVATAR = /^tenants\/([^/]+)\/users\/([^/]+)\/avatar\/[^/]+$/
const RE_CANDIDATE_AVATAR = /^candidates\/([^/]+)\/avatar\/[^/]+$/

export function parseTenantLogoKey(key: string): string | null {
  const m = RE_TENANT_LOGO.exec(key)
  return m?.[1] ?? null
}

export function parseTenantBannerKey(key: string): string | null {
  const m = RE_TENANT_BANNER.exec(key)
  return m?.[1] ?? null
}

export function parseTenantUserAvatarKey(key: string): { tenantId: string; userId: string } | null {
  const m = RE_TENANT_USER_AVATAR.exec(key)
  if (!m) return null
  return { tenantId: m[1], userId: m[2] }
}

export function parseCandidateAvatarKey(key: string): string | null {
  const m = RE_CANDIDATE_AVATAR.exec(key)
  return m?.[1] ?? null
}

export function buildCandidateAvatarKey(userId: string, objectId: string, ext: string): string {
  return `candidates/${userId}/avatar/${objectId}.${ext}`
}

export function buildTenantUserAvatarKey(
  tenantId: string,
  userId: string,
  objectId: string,
  ext: string,
): string {
  return `tenants/${tenantId}/users/${userId}/avatar/${objectId}.${ext}`
}

export function buildTenantLogoKey(tenantId: string, objectId: string, ext: string): string {
  return `tenants/${tenantId}/logo/${objectId}.${ext}`
}

export function buildTenantBannerKey(tenantId: string, objectId: string, ext: string): string {
  return `tenants/${tenantId}/banner/${objectId}.${ext}`
}

export function assertKeyMatchesTenant(
  key: string | null | undefined,
  tenantId: string,
  kind: 'logo' | 'banner',
): void {
  if (key === null || key === undefined || key === '') return
  const parsed = kind === 'logo' ? parseTenantLogoKey(key) : parseTenantBannerKey(key)
  if (parsed !== tenantId) {
    throw new BadRequestException('Invalid media key for this tenant')
  }
}

export function assertKeyMatchesB2bUserAvatar(
  key: string | null | undefined,
  tenantId: string,
  userId: string,
): void {
  if (key === null || key === undefined || key === '') return
  const parsed = parseTenantUserAvatarKey(key)
  if (!parsed || parsed.tenantId !== tenantId || parsed.userId !== userId) {
    throw new BadRequestException('Invalid media key for this user')
  }
}

export function assertKeyMatchesCandidateAvatar(
  key: string | null | undefined,
  userId: string,
): void {
  if (key === null || key === undefined || key === '') return
  const parsed = parseCandidateAvatarKey(key)
  if (parsed !== userId) {
    throw new BadRequestException('Invalid media key for this candidate')
  }
}

export function assertKeyMatchesCandidateResume(
  key: string | null | undefined,
  userId: string,
): void {
  if (key === null || key === undefined || key === '') return
  const parsed = parseStorageKey(key)
  if (
    !parsed ||
    parsed.scope !== 'CANDIDATE' ||
    parsed.namespace !== 'resumes' ||
    parsed.ownerId !== userId
  ) {
    throw new BadRequestException('Invalid resume key for this candidate')
  }
}
