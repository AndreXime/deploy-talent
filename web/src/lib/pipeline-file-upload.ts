/** Alinhado com `PIPELINE_FILE_UPLOAD_ALLOWED_MIME_TYPES` na API (PDF, DOCX, PNG, JPG, TXT). */
export const PIPELINE_FILE_UPLOAD_ACCEPT_ATTR =
  '.pdf,.docx,.png,.jpg,.jpeg,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,text/plain'

/** Texto curto para UI (tamanho exacto depende de S3_MAX_UPLOAD_BYTES e tecto de 10 MiB na API). */
export const PIPELINE_FILE_UPLOAD_HINT =
  'Tipos permitidos: PDF, DOCX, PNG, JPG, TXT. Tamanho máximo: o menor entre 10 MiB e o limite global de upload do servidor.'

const EXT_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  txt: 'text/plain',
}

export function resolveClientPipelineUploadMimeType(file: File): string {
  const raw = file.type?.split(';')[0]?.trim().toLowerCase() ?? ''
  if (raw && raw !== 'application/octet-stream') return raw
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_TO_MIME[ext] ?? ''
}
