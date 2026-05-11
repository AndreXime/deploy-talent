import { Injectable, Logger } from '@nestjs/common'
import type { Candidate } from '../../generated/prisma/client'
import { StorageService } from '../infra/storage/storage.service'

/** Perfil como exposto pela API em leitura: URLs GET assinadas em vez das chaves S3. */
export type CandidateProfileApiRead = Omit<Candidate, 'resumeKey' | 'avatarKey'> & {
  resumeUrl: string | null
  avatarUrl: string | null
}

@Injectable()
export class CandidateProfileReadService {
  private readonly logger = new Logger(CandidateProfileReadService.name)

  constructor(private readonly storage: StorageService) {}

  async toApiRead(candidate: Candidate): Promise<CandidateProfileApiRead> {
    const { resumeKey, avatarKey, ...rest } = candidate
    const [resumeUrl, avatarUrl] = await Promise.all([
      resumeKey ? this.signKey(resumeKey) : Promise.resolve(null),
      avatarKey ? this.signKey(avatarKey) : Promise.resolve(null),
    ])
    return { ...rest, resumeUrl, avatarUrl }
  }

  private async signKey(key: string): Promise<string | null> {
    try {
      const signed = await this.storage.presignDownload({ key })
      return signed.url
    } catch (err) {
      this.logger.warn(`Failed to presign object for read response`, err as Error)
      return null
    }
  }
}
