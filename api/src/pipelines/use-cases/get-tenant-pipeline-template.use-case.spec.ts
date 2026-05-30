import type { PrismaClient } from '../../../generated/prisma/client'
import { PipelineStageKind } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import { GetTenantPipelineTemplateUseCase } from './get-tenant-pipeline-template.use-case'

describe('GetTenantPipelineTemplateUseCase', () => {
  it('returns existing template', async () => {
    const template = {
      id: 'tpl1',
      name: 'Default',
      stages: [
        {
          id: 's1',
          position: 0,
          kind: PipelineStageKind.MANUAL,
          name: 'Triagem',
          config: {},
          required: true,
        },
      ],
    }
    const prisma = {
      pipelineTemplate: {
        findUnique: jest.fn(async () => template),
        create: jest.fn(),
      },
    }
    const useCase = new GetTenantPipelineTemplateUseCase(
      prisma as unknown as PrismaClient,
      { requireTenantId: () => 't1' } as TenantContextService,
    )
    const result = await useCase.execute()
    expect(result.id).toBe('tpl1')
    expect(result.stages).toHaveLength(1)
    expect(prisma.pipelineTemplate.create).not.toHaveBeenCalled()
  })

  it('creates default template when missing', async () => {
    const created = {
      id: 'tpl-new',
      name: 'Default',
      stages: [
        {
          id: 's1',
          position: 0,
          kind: PipelineStageKind.MANUAL,
          name: 'Triagem',
          config: {},
          required: true,
        },
      ],
    }
    const prisma = {
      pipelineTemplate: {
        findUnique: jest.fn(async () => null),
        create: jest.fn(async () => created),
      },
    }
    const useCase = new GetTenantPipelineTemplateUseCase(
      prisma as unknown as PrismaClient,
      { requireTenantId: () => 't1' } as TenantContextService,
    )
    const result = await useCase.execute()
    expect(result.stages[0]?.name).toBe('Triagem')
    expect(prisma.pipelineTemplate.create).toHaveBeenCalled()
  })
})
