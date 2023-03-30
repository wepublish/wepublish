/* eslint-disable @typescript-eslint/no-explicit-any */
import {Test, TestingModule} from '@nestjs/testing'
import {MailTemplate} from '@prisma/client'
import {MailProvider, MailProviderTemplate, OldContextService, PrismaService} from '@wepublish/api'
import {MailTemplateSyncService} from './mail-template-sync.service'

const mockTemplate1: MailTemplate = {
  id: 1,
  name: 'Mock Template 1',
  description: 'Mock Desc 1',
  externalMailTemplateId: 'slug-123',
  remoteMissing: false,
  createdAt: new Date(),
  modifiedAt: new Date()
}

const mockTemplate2: MailTemplate = {
  id: 1,
  name: 'Mock Template 2',
  description: 'Mock Desc 2',
  externalMailTemplateId: 'slug-234',
  remoteMissing: false,
  createdAt: new Date(),
  modifiedAt: new Date()
}

const mockRemoteTemplate1: MailProviderTemplate = {
  name: 'Mock Template 2',
  uniqueIdentifier: 'slug-234',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockRemoteTemplate2: MailProviderTemplate = {
  name: 'Mock Template 3',
  uniqueIdentifier: 'slug-345',
  createdAt: new Date(),
  updatedAt: new Date()
}

const prismaServiceMock = {
  mailTemplate: {
    findMany: jest.fn((): MailTemplate[] => [mockTemplate1, mockTemplate2]),
    create: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis()
  }
}

const mailProviderServiceMock = {
  name: 'MockProvider',
  getTemplateUrl: jest.fn((): string => 'https://example.com/template.html'),
  getTemplates: jest.fn((): MailProviderTemplate[] => [mockRemoteTemplate1, mockRemoteTemplate2])
}

const oldContextServiceMock = {
  context: {
    mailContext: {
      getProvider: jest.fn((): MailProvider => mailProviderServiceMock as unknown as MailProvider),
      getUsedTemplateIdentifiers: jest.fn((): string[] => [])
    }
  }
}

describe('MailTemplateSyncService', () => {
  let service: MailTemplateSyncService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailTemplateSyncService,
        {provide: PrismaService, useValue: prismaServiceMock},
        {provide: OldContextService, useValue: oldContextServiceMock}
      ]
    }).compile()

    service = module.get<MailTemplateSyncService>(MailTemplateSyncService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('syncTemplates', () => {
    // setup: two local templates, two remote templates; (1) is local only, (2) is both, (3) is remote only

    it('creates local templates for remote templates', async () => {
      await service.synchronizeTemplates()

      const createCalls = prismaServiceMock.mailTemplate.create.mock.calls
      expect(createCalls).toHaveLength(1)
      const template3Call = findTemplateCall(createCalls, 'data', 'slug-345')
      expect(template3Call.data.remoteMissing).toEqual(false)
    })

    it('updates local templates for remote templates', async () => {
      await service.synchronizeTemplates()

      const updateCalls = prismaServiceMock.mailTemplate.update.mock.calls
      expect(updateCalls).toHaveLength(2)
      const template1Call = findTemplateCall(updateCalls, 'where', 'slug-123')
      expect(template1Call.data.remoteMissing).toEqual(true)
      const template2Call = findTemplateCall(updateCalls, 'where', 'slug-234')
      expect(template2Call.data.remoteMissing).toEqual(false)
    })

    /**
     * Find a specific call to a mock
     * @param calls The array of calls recorded by the mock
     * @param property The property to search the externalMailTemplate
     * @param templateName The name of the template
     * @returns The specific call to the mock
     */
    const findTemplateCall = function (calls: any[], property: string, templateName: string) {
      return calls.find((c: any) => c[0][property].externalMailTemplateId === templateName)[0]
    }
  })
})
