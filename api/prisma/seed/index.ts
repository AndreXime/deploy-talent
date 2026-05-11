import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'
import { Pool } from 'pg'
import { ApplicationStatus, JobStatus, PrismaClient, UserRole } from '../../generated/prisma/client'
import { buildSeedJobDescription } from './lorem'
import { buildSeedJobTitle, SEED_TENANT_NAMES } from './names'
import { ensureSeedPlaceholdersUploaded, SEED_PLACEHOLDER_KEYS } from './storage'
import type {
  MockApplicationExport,
  MockCandidateExport,
  MockJobRef,
  MockTenantExport,
  MockUserRef,
  TenantSeed,
} from './types'
import {
  buildInterleavedTenantInsertionOrder,
  clearSeedData,
  SEED_PASSWORD,
  seedEmail,
  shuffleInPlace,
  writeMockDataFile,
} from './utils'

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }

  const pool = new Pool({ connectionString: databaseUrl })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    await clearSeedData(prisma)
    await ensureSeedPlaceholdersUploaded()

    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10)

    const superUser = await prisma.user.create({
      data: {
        email: seedEmail('superadmin'),
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        tenantId: null,
      },
      select: { id: true, email: true, role: true },
    })

    const modalities = ['Remoto', 'Híbrido', 'Presencial']
    const locations = ['São Paulo', 'Curitiba', 'Belo Horizonte', 'Recife', 'Florianópolis']
    const seniorities = ['Júnior', 'Pleno', 'Sênior', 'Especialista']

    const tenants: TenantSeed[] = []
    const tenantRows: {
      index: number
      slug: string
      tenant: { id: string; name: string }
      admin: { id: string; email: string; role: string }
      recruiters: MockUserRef[]
      jobsExport: MockJobRef[]
      jobIds: string[]
    }[] = []

    for (let i = 1; i <= 5; i += 1) {
      const slug = `seed-emp-${i}`
      const tenantName = SEED_TENANT_NAMES[i - 1]
      const tenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          slug,
          isActive: true,
          logoKey: SEED_PLACEHOLDER_KEYS.tenantLogo,
          bannerKey: SEED_PLACEHOLDER_KEYS.tenantBanner,
        },
        select: { id: true, name: true },
      })

      const admin = await prisma.user.create({
        data: {
          email: seedEmail(`emp${i}-admin`),
          passwordHash,
          role: UserRole.TENANT_ADMIN,
          tenantId: tenant.id,
        },
        select: { id: true, email: true, role: true },
      })

      const recruiters: MockUserRef[] = []
      for (let r = 1; r <= 5; r += 1) {
        const rec = await prisma.user.create({
          data: {
            email: seedEmail(`emp${i}-rec${r}`),
            passwordHash,
            role: UserRole.RECRUITER,
            tenantId: tenant.id,
          },
          select: { id: true, email: true, role: true },
        })
        recruiters.push({ id: rec.id, email: rec.email, role: rec.role })
      }

      tenantRows.push({
        index: i,
        slug,
        tenant,
        admin,
        recruiters,
        jobsExport: [],
        jobIds: [],
      })
    }

    const jobsPerTenant = 10
    const insertionOrder = buildInterleavedTenantInsertionOrder(5, jobsPerTenant)
    const jobOrdinalPerTenant = [0, 0, 0, 0, 0]

    for (const tenantIndex of insertionOrder) {
      const row = tenantRows[tenantIndex - 1]
      const i = row.index
      jobOrdinalPerTenant[tenantIndex - 1] += 1
      const j = jobOrdinalPerTenant[tenantIndex - 1]
      const modality = modalities[(i + j) % modalities.length]
      const location = locations[(i + j) % locations.length]
      const seniority = seniorities[(i + j) % seniorities.length]
      const title = buildSeedJobTitle(i, j)
      const job = await prisma.job.create({
        data: {
          tenantId: row.tenant.id,
          title,
          description: buildSeedJobDescription(row.tenant.name, title),
          modality,
          location,
          seniority,
          status: JobStatus.PUBLISHED,
        },
        select: {
          id: true,
          title: true,
          tenantId: true,
          modality: true,
          location: true,
          seniority: true,
          status: true,
        },
      })
      row.jobIds.push(job.id)
      row.jobsExport.push({
        id: job.id,
        title: job.title,
        tenantId: job.tenantId,
        modality: job.modality,
        location: job.location,
        seniority: job.seniority,
        status: job.status,
      })
    }

    for (const row of tenantRows) {
      const tenantExport: MockTenantExport = {
        index: row.index,
        id: row.tenant.id,
        name: row.tenant.name,
        slug: row.slug,
        tenantAdmin: { id: row.admin.id, email: row.admin.email, role: row.admin.role },
        recruiters: row.recruiters,
        jobs: row.jobsExport,
      }
      tenants.push({
        tenantId: row.tenant.id,
        slug: row.slug,
        name: row.tenant.name,
        index: row.index,
        jobIds: row.jobIds,
        export: tenantExport,
      })
    }

    const allJobs = tenants.flatMap((t) =>
      t.jobIds.map((jobId) => ({ jobId, tenantId: t.tenantId })),
    )

    const candidatesExport: MockCandidateExport[] = []
    const candidateRecords: { id: string; userId: string }[] = []

    for (let c = 1; c <= 30; c += 1) {
      const user = await prisma.user.create({
        data: {
          email: seedEmail(`cand${c}`),
          passwordHash,
          role: UserRole.CANDIDATE,
          tenantId: null,
        },
        select: { id: true, email: true },
      })
      const candidate = await prisma.candidate.create({
        data: {
          userId: user.id,
          name: `Candidato Seed ${c}`,
          email: user.email,
          phone: `+55119999${String(1000 + c).slice(-4)}`,
          avatarKey: SEED_PLACEHOLDER_KEYS.candidateAvatar,
        },
        select: { id: true, userId: true, email: true, name: true, phone: true },
      })
      candidateRecords.push({ id: candidate.id, userId: candidate.userId })
      candidatesExport.push({
        userId: candidate.userId,
        candidateId: candidate.id,
        email: candidate.email,
        name: candidate.name,
        phone: candidate.phone ?? '',
      })
    }

    const pairKeys = new Set<string>()
    const applicationsToCreate: {
      tenantId: string
      jobId: string
      candidateId: string
      candidateUserId: string
    }[] = []

    for (const cand of candidateRecords) {
      const n = 2 + Math.floor(Math.random() * 5)
      const jobsPool = [...allJobs]
      shuffleInPlace(jobsPool)
      for (const pick of jobsPool.slice(0, n)) {
        const key = `${pick.tenantId}:${pick.jobId}:${cand.id}`
        if (pairKeys.has(key)) continue
        pairKeys.add(key)
        applicationsToCreate.push({
          tenantId: pick.tenantId,
          jobId: pick.jobId,
          candidateId: cand.id,
          candidateUserId: cand.userId,
        })
      }
    }

    const applicationsExport: MockApplicationExport[] = []

    for (const row of applicationsToCreate) {
      const app = await prisma.application.create({
        data: {
          tenantId: row.tenantId,
          jobId: row.jobId,
          candidateId: row.candidateId,
          status: ApplicationStatus.APPLIED,
          appliedAt: new Date(),
        },
        select: { id: true, tenantId: true, jobId: true, candidateId: true, status: true },
      })
      await prisma.applicationHistory.create({
        data: {
          tenantId: row.tenantId,
          applicationId: app.id,
          movedByUserId: row.candidateUserId,
          fromStatus: ApplicationStatus.APPLIED,
          toStatus: ApplicationStatus.APPLIED,
        },
      })
      applicationsExport.push({
        id: app.id,
        tenantId: app.tenantId,
        jobId: app.jobId,
        candidateId: app.candidateId,
        status: app.status,
      })
    }

    const mockData = {
      generatedAt: new Date().toISOString(),
      password: SEED_PASSWORD,
      superAdmin: {
        id: superUser.id,
        email: superUser.email,
        role: superUser.role,
      },
      tenants: tenants.map((t) => t.export),
      candidates: candidatesExport,
      applications: applicationsExport,
    }

    const mockDataPath = await writeMockDataFile(mockData)

    const lines = [
      '',
      '=== Seed concluído ===',
      `Arquivo: ${mockDataPath}`,
      `Senha única para todos os logins: ${SEED_PASSWORD}`,
      '',
      'SUPER_ADMIN:',
      `  ${seedEmail('superadmin')}`,
      '',
      'Por empresa (TENANT_ADMIN + 5 RECRUITER):',
      ...Array.from({ length: 5 }, (_, i) => {
        const n = i + 1
        return [
          `  ${SEED_TENANT_NAMES[i]} (seed-emp-${n}):`,
          `    admin: ${seedEmail(`emp${n}-admin`)}`,
          ...Array.from(
            { length: 5 },
            (_, r) => `    recrutador ${r + 1}: ${seedEmail(`emp${n}-rec${r + 1}`)}`,
          ),
        ].join('\n')
      }),
      '',
      'Candidatos (30):',
      `  ${seedEmail('cand1')} ... ${seedEmail('cand30')}`,
      '',
      `Candidaturas criadas: ${applicationsToCreate.length}`,
      '',
    ]
    console.log(lines.join('\n'))
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
