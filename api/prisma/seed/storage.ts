import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3'

/**
 * Chaves fixas para os placeholders do seed.
 *
 * Não seguem o padrão `candidates/{userId}/...` ou `tenants/{id}/...` de propósito:
 * o seed escreve a chave diretamente via Prisma (sem passar pelos validadores dos
 * controllers) e as leituras apenas assinam a chave que estiver na BD. Manter um
 * prefixo `seed/` torna explícito que estes objetos são compartilhados por todos os
 * registos do seed e nunca devem ser apagados pelos `forget-me` / atualizações de
 * branding.
 */
export const SEED_PLACEHOLDER_KEYS = {
  candidateAvatar: 'seed/placeholders/candidate-avatar.webp',
  tenantLogo: 'seed/placeholders/tenant-logo.webp',
  tenantBanner: 'seed/placeholders/tenant-banner.webp',
} as const

const PLACEHOLDER_FILES: { key: string; fileName: string }[] = [
  { key: SEED_PLACEHOLDER_KEYS.candidateAvatar, fileName: 'candidate.webp' },
  { key: SEED_PLACEHOLDER_KEYS.tenantLogo, fileName: 'company.webp' },
  { key: SEED_PLACEHOLDER_KEYS.tenantBanner, fileName: 'banner.webp' },
]

const PLACEHOLDER_CONTENT_TYPE = 'image/webp'

function buildS3Client(): { client: S3Client; bucket: string } {
  const bucket = process.env.S3_BUCKET
  if (!bucket || bucket.trim().length === 0) {
    throw new Error('Missing S3_BUCKET to upload seed placeholders')
  }

  const region = process.env.AWS_REGION ?? 'us-east-1'
  const endpoint = process.env.S3_ENDPOINT ?? undefined
  const forcePathStyle =
    process.env.S3_FORCE_PATH_STYLE === 'true' || process.env.S3_FORCE_PATH_STYLE === '1'
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  })

  return { client, bucket }
}

async function objectExists(client: S3Client, bucket: string, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch (err) {
    if (err instanceof S3ServiceException) {
      if (err.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') return false
    }
    throw err
  }
}

/**
 * Garante que os placeholders de avatar/logo/banner existem no bucket configurado.
 * Faz upload apenas dos que ainda não existem — runs repetidos do seed são no-op
 * a partir do segundo em diante.
 */
export async function ensureSeedPlaceholdersUploaded(): Promise<void> {
  const { client, bucket } = buildS3Client()
  const placeholderDir = join(process.cwd(), 'prisma', 'seed', 'placeholder')

  let uploaded = 0
  let skipped = 0

  for (const { key, fileName } of PLACEHOLDER_FILES) {
    if (await objectExists(client, bucket, key)) {
      skipped += 1
      continue
    }
    const body = await readFile(join(placeholderDir, fileName))
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: PLACEHOLDER_CONTENT_TYPE,
      }),
    )
    uploaded += 1
  }

  client.destroy()
  console.log(
    `[seed] Placeholders S3 — bucket="${bucket}" enviados=${uploaded} já-existiam=${skipped}`,
  )
}
