import { allocateUniqueTenantSlug, companyNameToTenantSlugBase } from './tenant-slug-from-name'

describe('companyNameToTenantSlugBase', () => {
  it('normaliza acentos e espaços', () => {
    expect(companyNameToTenantSlugBase('  Café São João  ')).toBe('cafe-sao-joao')
  })

  it('usa fallback quando não sobram caracteres válidos', () => {
    expect(companyNameToTenantSlugBase('   @@@   ')).toBe('empresa')
  })
})

describe('allocateUniqueTenantSlug', () => {
  it('repete com sufixo numérico até encontrar livre', async () => {
    const prisma = {
      tenant: {
        findFirst: jest.fn(async (args: { where: { slug: string } }) => {
          if (args.where.slug === 'acme') return { id: 't0' }
          return null
        }),
      },
    }
    const slug = await allocateUniqueTenantSlug(prisma, 'Acme')
    expect(slug).toBe('acme-2')
    expect(prisma.tenant.findFirst).toHaveBeenCalledTimes(2)
  })
})
