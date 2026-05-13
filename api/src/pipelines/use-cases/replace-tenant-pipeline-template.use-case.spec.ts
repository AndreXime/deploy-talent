import { BadRequestException } from '@nestjs/common'
import { PipelineStageKind, type PrismaClient } from '../../../generated/prisma/client'
import { TenantContextService } from '../../tenant-context/tenant-context.service'
import {
  GetTenantPipelineTemplateUseCase,
  type TenantPipelineTemplateView,
} from './get-tenant-pipeline-template.use-case'
import { ReplaceTenantPipelineTemplateUseCase } from './replace-tenant-pipeline-template.use-case'

describe('ReplaceTenantPipelineTemplateUseCase', () => {
  function buildPrisma(overrides: Record<string, unknown> = {}) {
    const tx = {
      pipelineTemplate: { upsert: jest.fn(async () => ({ id: 'tpl1' })) },
      templateStage: {
        deleteMany: jest.fn(async () => ({ count: 0 })),
        createMany: jest.fn(async () => ({ count: 0 })),
      },
    }
    return {
      $transaction: jest.fn(async (cb: (tx: typeof tx) => Promise<unknown>) => cb(tx)),
      __tx: tx,
      ...overrides,
    } as unknown as PrismaClient & { __tx: typeof tx }
  }

  function buildContext() {
    return { requireTenantId: () => 't1' } as unknown as TenantContextService
  }

  function buildGetTemplate(view: TenantPipelineTemplateView) {
    return {
      execute: jest.fn(async () => view),
    } as unknown as GetTenantPipelineTemplateUseCase
  }

  it('rejeita lista vazia de etapas', async () => {
    const prisma = buildPrisma()
    const useCase = new ReplaceTenantPipelineTemplateUseCase(
      prisma,
      buildContext(),
      buildGetTemplate({ id: 'x', name: 'y', stages: [] }),
    )
    await expect(useCase.execute({ stages: [] })).rejects.toBeInstanceOf(BadRequestException)
  })

  it('persiste etapas normalizando posições e configs', async () => {
    const prisma = buildPrisma()
    const getTemplate = buildGetTemplate({
      id: 'tpl1',
      name: 'Pipeline default',
      stages: [],
    })
    const useCase = new ReplaceTenantPipelineTemplateUseCase(prisma, buildContext(), getTemplate)

    await useCase.execute({
      stages: [
        { kind: PipelineStageKind.MANUAL, name: 'Triagem' },
        {
          kind: PipelineStageKind.QUESTIONNAIRE,
          name: 'Form',
          config: {
            questions: [{ id: 'q1', label: 'A', type: 'TEXT_SHORT', required: true }],
          },
        },
      ],
    })

    const tx = (prisma as unknown as { __tx: ReturnType<typeof buildPrisma>['__tx'] }).__tx
    expect(tx.templateStage.deleteMany).toHaveBeenCalledWith({ where: { templateId: 'tpl1' } })
    expect(tx.templateStage.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ position: 0, name: 'Triagem', kind: 'MANUAL' }),
        expect.objectContaining({ position: 1, name: 'Form', kind: 'QUESTIONNAIRE' }),
      ],
    })
    expect(getTemplate.execute).toHaveBeenCalled()
  })

  it('rejeita questionário inválido', async () => {
    const prisma = buildPrisma()
    const useCase = new ReplaceTenantPipelineTemplateUseCase(
      prisma,
      buildContext(),
      buildGetTemplate({ id: 'x', name: 'y', stages: [] }),
    )
    await expect(
      useCase.execute({
        stages: [{ kind: PipelineStageKind.QUESTIONNAIRE, name: 'X', config: { questions: [] } }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
