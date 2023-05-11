import {Test, TestingModule} from '@nestjs/testing'
import {MailTemplate} from '@prisma/client'
import {MailProvider, MailTemplateStatus} from '@wepublish/api'
import {OldContextService, PrismaService} from '@wepublish/nest-modules'
import {MailTemplateSyncService} from './mail-template-sync.service'
import {MailTemplatesResolver} from './mail-template.resolver'
import {INestApplication, Module} from '@nestjs/common'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {PrismaModule} from '@wepublish/nest-modules'
import {APP_GUARD} from '@nestjs/core'
import {PermissionsGuard} from '@wepublish/permissions/api'
import request from 'supertest'

const mailTemplatesQuery = `
  query MailTemplates {
    mailTemplates {
      id
    }
  }
`
const providerQuery = `
  query Provider {
    provider {
      name
    }
  }
`
const syncTemplatesMutation = `
  mutation Mutation {
    syncTemplates
  }
`

const mockTemplate1: MailTemplate = {
  id: '8056eda4-9013-42eb-b584-55a4f450eaf3',
  name: 'Mock Template 1',
  description: 'Mock Desc 1',
  externalMailTemplateId: '123',
  remoteMissing: false,
  createdAt: new Date(),
  modifiedAt: new Date()
}

const mockTemplate2: MailTemplate = {
  id: '400764ac-babf-4662-bc6b-225260ac7f70',
  name: 'Mock Template 2',
  description: 'Mock Desc 2',
  externalMailTemplateId: '124',
  remoteMissing: true,
  createdAt: new Date(),
  modifiedAt: new Date()
}

const prismaServiceMock = {
  mailTemplate: {
    findMany: jest.fn((): MailTemplate[] => [mockTemplate1, mockTemplate2])
  }
}

const mailProviderServiceMock = {
  name: 'MockProvider',
  getTemplateUrl: jest.fn((): string => 'https://example.com/template.html')
}

const oldContextServiceMock = {
  context: {
    mailContext: {
      getProvider: jest.fn((): MailProvider => mailProviderServiceMock as unknown as MailProvider),
      getUsedTemplateIdentifiers: jest.fn((): string[] => [])
    }
  }
}

const syncServiceMock = {
  synchronizeTemplates: jest.fn((): void => undefined)
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/'
    }),
    PrismaModule
  ],
  providers: [
    PrismaService,
    OldContextService,
    MailTemplatesResolver,
    MailTemplateSyncService,
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard
    }
  ]
})
export class AppModule {}

describe('MailTemplatesResolver', () => {
  let resolver: MailTemplatesResolver
  let app: INestApplication

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()
    app = module.createNestApplication()
    await app.init()
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailTemplatesResolver,
        {provide: PrismaService, useValue: prismaServiceMock},
        {provide: MailTemplateSyncService, useValue: syncServiceMock},
        {provide: OldContextService, useValue: oldContextServiceMock}
      ]
    }).compile()

    resolver = module.get<MailTemplatesResolver>(MailTemplatesResolver)
  })

  afterAll(async () => {
    await app.close()
  })

  it('is defined', () => {
    expect(resolver).toBeDefined()
  })

  it('returns all templates', async () => {
    const result = await resolver.mailTemplates()
    expect(result.length).toEqual(2)
    expect(result[0].name).toEqual('Mock Template 1')
    expect(result[1].name).toEqual('Mock Template 2')
  })

  it('computes the template url', async () => {
    const result = await resolver.mailTemplates()
    expect(result.length).toEqual(2)
    expect(result[0].url).toEqual('https://example.com/template.html')
    expect(result[1].url).toEqual('https://example.com/template.html')
  })

  it('resolves the provider', async () => {
    const result = await resolver.provider()
    expect(result.name).toEqual('MockProvider')
  })

  it('synchronizes the mail templates', async () => {
    const result = await resolver.syncTemplates()
    expect(result).toEqual(true)
  })

  it('computes the template status', async () => {
    const result = await resolver.mailTemplates()
    expect(result.length).toEqual(2)
    expect(result[0].status).toEqual(MailTemplateStatus.Unused)
    expect(result[1].status).toEqual(MailTemplateStatus.RemoteMissing)
  })

  /**
   * Test if endpoints are not exposed to public
   */
  it('mailTemplates is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: mailTemplatesQuery
      })
      .expect(200)
      .expect(({body}) => {
        expect(!!body.errors.find((error: any) => error.message === 'Forbidden resource')).toEqual(
          true
        )
        expect(body.data).toBeNull()
      })
  })

  it('provider is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: providerQuery
      })
      .expect(200)
      .expect(({body}) => {
        expect(!!body.errors.find((error: any) => error.message === 'Forbidden resource')).toEqual(
          true
        )
        expect(body.data).toBeNull()
      })
  })

  it('syncMailTemplates is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: syncTemplatesMutation
      })
      .expect(200)
      .expect(({body}) => {
        expect(!!body.errors.find((error: any) => error.message === 'Forbidden resource')).toEqual(
          true
        )
        expect(body.data).toBeNull()
      })
  })
})
