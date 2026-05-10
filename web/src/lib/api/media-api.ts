import { apiRequest } from '@/lib/api/client'
import type { PresignedUrlResponse } from '@/lib/api/types'

export type MediaUploadPurpose =
  | 'CANDIDATE_AVATAR'
  | 'CANDIDATE_RESUME'
  | 'B2B_USER_AVATAR'
  | 'TENANT_LOGO'
  | 'TENANT_BANNER'

export function presignUpload(
  token: string,
  body: { purpose: MediaUploadPurpose; contentType: string; fileName?: string },
) {
  return apiRequest<PresignedUrlResponse>('/media/presign-upload', {
    method: 'POST',
    token,
    json: body,
  })
}

export function presignDownload(token: string, key: string) {
  return apiRequest<PresignedUrlResponse>('/media/presign-download', {
    method: 'POST',
    token,
    json: { key },
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
