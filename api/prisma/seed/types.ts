export interface MockUserRef {
  id: string
  email: string
  role: string
}

export interface MockJobRef {
  id: string
  title: string
  tenantId: string
  modality: string
  location: string
  seniority: string
  status: string
}

export interface MockTenantExport {
  index: number
  id: string
  name: string
  slug: string
  tenantAdmin: MockUserRef
  recruiters: MockUserRef[]
  jobs: MockJobRef[]
}

export interface MockCandidateExport {
  userId: string
  candidateId: string
  email: string
  name: string
  phone: string
}

export interface MockApplicationExport {
  id: string
  tenantId: string
  jobId: string
  candidateId: string
  status: string
}

export interface TenantSeed {
  tenantId: string
  slug: string
  name: string
  index: number
  jobIds: string[]
  export: MockTenantExport
}
