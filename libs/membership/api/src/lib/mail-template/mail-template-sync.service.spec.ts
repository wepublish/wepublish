import { Test, TestingModule } from '@nestjs/testing'
import { MailTemplate } from '@prisma/client'
import {MailProviderTemplate, PrismaService} from '@wepublish/api'
import {MailProviderService} from './mail-provider.service'
import {MailTemplateSyncService} from './mail-template-sync.service'

const mockTemplate: MailTemplate = {
  id: 1,
  name: 'Mock Template',
  description: 'Mock Desc',
  externalMailTemplateId: 'slug-123',
  remoteMissing: false,
  createdAt: new Date(),
  modifiedAt: new Date()
}

const mockRemoteTemplate: MailProviderTemplate ={
  name: 'Mock Template',
  uniqueIdentifier: 'slug-345',
  createdAt: new Date(),
  updatedAt: new Date()
}

const prismaServiceMock = {
  mailTemplate: {
    findMany: jest.fn((): MailTemplate[] => [mockTemplate]),
    create: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  }
}

const mailProviderServiceMock = {
  name: 'MockProvider',
  getProvider: jest.fn().mockReturnThis(),
  getTemplates: jest.fn((): MailProviderTemplate[] => [mockRemoteTemplate])
}

describe('MailTemplateSyncService', () => {
  let service: MailTemplateSyncService

  beforeEach(async () => {
    process.env['MAIL_PROVIDER_NAME'] = 'mailchimp'
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailTemplateSyncService,
        {provide: PrismaService, useValue: prismaServiceMock},
        {provide: MailProviderService, useValue: mailProviderServiceMock}
      ]
    }).compile()

    service = module.get<MailTemplateSyncService>(MailTemplateSyncService)
  })

  describe('syncTemplates', () => {
    it('creates new templates', async () => {
      await service.synchronizeTemplates()

      const createCalls = prismaServiceMock.mailTemplate.create.mock.calls
      expect(createCalls).toHaveLength(1)
      expect(createCalls[0][0].data.externalMailTemplateId).toEqual("slug-345")

      const updateCalls = prismaServiceMock.mailTemplate.update.mock.calls
      expect(updateCalls).toHaveLength(1)
      expect(updateCalls[0][0].where.externalMailTemplateId).toEqual("slug-123")
      expect(updateCalls[0][0].data.remoteMissing).toEqual(true)

      expect(prismaServiceMock.mailTemplate.delete.mock.calls).toHaveLength(0)
    })
  })
})
