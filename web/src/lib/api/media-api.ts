import { apiRequest } from '@/lib/api/client'
import type { PresignedUrlResponse } from '@/lib/api/types'

export type MediaUploadPurpose =
  | 'CANDIDATE_AVATAR'
  | 'CANDIDATE_RESUME'
  | 'APPLICATION_STAGE_FILE'
  | 'B2B_USER_AVATAR'
  | 'TENANT_LOGO'
  | 'TENANT_BANNER'

export function presignUpload(
  token: string,
  body: {
    purpose: MediaUploadPurpose
    contentType: string
    fileName?: string
    applicationId?: string
  },
) {
  return apiRequest<PresignedUrlResponse>('/media/presign-upload', {
    method: 'POST',
    token,
    json: body,
  })
}

export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: Blob,
  contentType: string,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  })
  if (!res.ok) {
    throw new Error('Falha ao enviar o ficheiro.')
  }
}
