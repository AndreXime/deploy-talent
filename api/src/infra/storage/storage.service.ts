import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable, Logger } from '@nestjs/common'
import { EnvService } from '../env/env.service'

export interface PresignUploadInput {
  key: string
  contentType: string
  contentLength?: number
  expiresInSeconds?: number
}

export interface PresignDownloadInput {
  key: string
  expiresInSeconds?: number
}

export interface PresignedUrl {
  url: string
  key: string
  expiresAt: Date
  expiresInSeconds: number
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly client: S3Client

  constructor(private readonly env: EnvService) {
    this.client = new S3Client({
      region: this.env.awsRegion,
      endpoint: this.env.s3Endpoint ?? undefined,
      forcePathStyle: this.env.s3ForcePathStyle,
      credentials:
        this.env.s3AccessKeyId !== null && this.env.s3SecretAccessKey !== null
          ? {
              accessKeyId: this.env.s3AccessKeyId,
              secretAccessKey: this.env.s3SecretAccessKey,
            }
          : undefined,
    })
  }

  get bucket(): string {
    return this.env.s3Bucket
  }

  async presignUpload(input: PresignUploadInput): Promise<PresignedUrl> {
    const expiresInSeconds = input.expiresInSeconds ?? this.env.s3PresignTtlSeconds

    const command = new PutObjectCommand({
      Bucket: this.env.s3Bucket,
      Key: input.key,
      ContentType: input.contentType,
      ContentLength: input.contentLength,
    })

    const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds })
    return {
      url,
      key: input.key,
      expiresInSeconds,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    }
  }

  async presignDownload(input: PresignDownloadInput): Promise<PresignedUrl> {
    const expiresInSeconds = input.expiresInSeconds ?? this.env.s3PresignTtlSeconds

    const command = new GetObjectCommand({
      Bucket: this.env.s3Bucket,
      Key: input.key,
    })

    const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds })
    return {
      url,
      key: input.key,
      expiresInSeconds,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.env.s3Bucket, Key: key }))
    } catch (err) {
      this.logger.error(`Failed to delete object "${key}"`, err as Error)
      throw err
    }
  }
}
