import { createTenantScopedHandlers } from './tenant-prisma.extension'

type JobRow = { id: string; tenantId: string; title: string }

function createInMemoryJobModel(initial: JobRow[]) {
  const store = new Map(initial.map((row) => [row.id, { ...row }]))

  return {
    findMany: jest.fn(async ({ where }: { where?: { tenantId?: string } }) =>
      [...store.values()].filter((row) => !where?.tenantId || row.tenantId === where.tenantId),
    ),
    findFirst: jest.fn(async ({ where }: { where?: { id?: string; tenantId?: string } }) => {
      const row = where?.id ? store.get(where.id) : undefined
      if (!row) return null
      if (where?.tenantId && row.tenantId !== where.tenantId) return null
      return { ...row }
    }),
    findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
      const row = store.get(where.id)
      return row ? { ...row } : null
    }),
    count: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(async ({ where, data }: { where: { id: string }; data: Partial<JobRow> }) => {
      const row = store.get(where.id)
      if (!row) throw new Error('Record not found')
      const updated = { ...row, ...data }
      store.set(where.id, updated)
      return { ...updated }
    }),
    updateMany: jest.fn(
      async ({
        where,
        data,
      }: {
        where: { id?: string; tenantId?: string }
        data: Partial<JobRow>
      }) => {
        let count = 0
        for (const [id, row] of store) {
          if (where.id && id !== where.id) continue
          if (where.tenantId && row.tenantId !== where.tenantId) continue
          store.set(id, { ...row, ...data })
          count += 1
        }
        return { count }
      },
    ),
    delete: jest.fn(async ({ where }: { where: { id: string } }) => {
      const row = store.get(where.id)
      if (!row) throw new Error('Record not found')
      store.delete(where.id)
      return { ...row }
    }),
    deleteMany: jest.fn(async ({ where }: { where: { id?: string; tenantId?: string } }) => {
      let count = 0
      for (const [id, row] of store) {
        if (where.id && id !== where.id) continue
        if (where.tenantId && row.tenantId !== where.tenantId) continue
        store.delete(id)
        count += 1
      }
      return { count }
    }),
    store,
  }
}

function wrapJobModel(model: ReturnType<typeof createInMemoryJobModel>, tenantId: string | null) {
  const tenantContext = { getTenantId: () => tenantId }
  const handlers = createTenantScopedHandlers(model, tenantContext)

  const run = (op: 'findUnique' | 'update' | 'delete') => async (args: unknown) =>
    handlers[op]({
      args,
      query: (a) => (model[op] as (a: unknown) => Promise<unknown>)(a),
    })

  return {
    findUnique: run('findUnique'),
    update: run('update'),
    delete: run('delete'),
    store: model.store,
  }
}

describe('tenantPrismaExtension', () => {
  const seed = [
    { id: 'j1', tenantId: 't1', title: 'Job A' },
    { id: 'j2', tenantId: 't2', title: 'Job B' },
  ]

  it('findUnique returns null for job of another tenant', async () => {
    const model = createInMemoryJobModel(seed)
    const job = wrapJobModel(model, 't1')
    await expect(job.findUnique({ where: { id: 'j2' } })).resolves.toBeNull()
  })

  it('findUnique returns job when tenant matches', async () => {
    const model = createInMemoryJobModel(seed)
    const job = wrapJobModel(model, 't1')
    await expect(job.findUnique({ where: { id: 'j1' } })).resolves.toEqual({
      id: 'j1',
      tenantId: 't1',
      title: 'Job A',
    })
  })

  it('findUnique without tenant context bypasses filter', async () => {
    const model = createInMemoryJobModel(seed)
    const job = wrapJobModel(model, null)
    await expect(job.findUnique({ where: { id: 'j2' } })).resolves.toEqual({
      id: 'j2',
      tenantId: 't2',
      title: 'Job B',
    })
  })

  it('update does not affect job of another tenant', async () => {
    const model = createInMemoryJobModel(seed)
    const job = wrapJobModel(model, 't1')
    await expect(job.update({ where: { id: 'j2' }, data: { title: 'Hacked' } })).rejects.toThrow(
      'Record not found',
    )
    expect(model.store.get('j2')?.title).toBe('Job B')
  })

  it('update changes job when tenant matches', async () => {
    const model = createInMemoryJobModel(seed)
    const job = wrapJobModel(model, 't1')
    await expect(job.update({ where: { id: 'j1' }, data: { title: 'Updated' } })).resolves.toEqual({
      id: 'j1',
      tenantId: 't1',
      title: 'Updated',
    })
  })

  it('delete removes job only when tenant matches', async () => {
    const model = createInMemoryJobModel(seed)
    const job = wrapJobModel(model, 't1')
    await expect(job.delete({ where: { id: 'j1' } })).resolves.toEqual({
      id: 'j1',
      tenantId: 't1',
      title: 'Job A',
    })
    expect(model.store.has('j1')).toBe(false)
    await expect(job.delete({ where: { id: 'j2' } })).rejects.toThrow('Record not found')
    expect(model.store.has('j2')).toBe(true)
  })
})
