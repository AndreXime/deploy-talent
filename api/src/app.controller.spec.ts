import { Test, type TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should return structured root metadata', () => {
      const body = appController.getRoot()

      expect(body.name).toBe('Deploy Talent API')
      expect(body.status).toBe('ok')
      expect(body.version.length).toBeGreaterThan(0)
      expect(typeof body.uptimeSeconds).toBe('number')
      expect(Number.isFinite(body.uptimeSeconds)).toBe(true)
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })
})
