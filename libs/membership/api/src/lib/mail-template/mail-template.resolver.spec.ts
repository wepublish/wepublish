import {Test, TestingModule} from '@nestjs/testing'
import {MailTemplate} from '@prisma/client'
import {PrismaService} from '@wepublish/api'
import {MailProviderService} from './mail-provider.service'
import { MailTemplateSyncService } from './mail-template-sync.service'
import {MailTemplatesResolver} from './mail-template.resolver'

const mockTemplate: MailTemplate = {
  id: 1,
  name: 'Mock Template',
  description: 'Mock Desc',
  externalMailTemplateId: '123',
  remoteMissing: false,
  createdAt: new Date(),
  modifiedAt: new Date()
}

const prismaServiceMock = {
  mailTemplate: {
    findMany: jest.fn((): MailTemplate[] => [mockTemplate])
  }
}

const mailProviderServiceMock = {
  name: 'MockProvider',
  getProvider: jest.fn().mockReturnThis(),
  getTemplateUrl: jest.fn((): string => 'https://example.com/template.html')
}

describe('MailTemplatesResolver', () => {
  let resolver: MailTemplatesResolver

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailTemplatesResolver,
        {provide: PrismaService, useValue: prismaServiceMock},
        {provide: MailTemplateSyncService, useValue: {}},
        {provide: MailProviderService, useValue: mailProviderServiceMock}
      ]
    }).compile()

    resolver = module.get<MailTemplatesResolver>(MailTemplatesResolver)
  })

  it('is defined', () => {
    expect(resolver).toBeDefined()
  })

  it('returns all templates', async () => {
    const result = await resolver.mailTemplates()
    expect(result.length).toEqual(1)
    expect(result[0].name).toEqual('Mock Template')
  })

  it('computes the template url', async () => {
    const result = await resolver.mailTemplates()
    expect(result.length).toEqual(1)
    expect(result[0].url).toEqual('https://example.com/template.html')
  })

  it('resolves the provider', async () => {
    const result = await resolver.provider()
    expect(result.name).toEqual('MockProvider')
  })
})
