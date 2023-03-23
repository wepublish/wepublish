import {Test, TestingModule} from '@nestjs/testing'
import {MailTemplate} from '@prisma/client'
import {PrismaService} from '@wepublish/api'
import {MailProviderService} from './mail-provider.service'
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
  getTemplateUrl: jest.fn((): string => 'https://example.com/template.html'),
  getUsedTemplateIdentifiers: jest.fn((): string[] => [])
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
    MailProviderService,
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
        {provide: MailTemplateSyncService, useValue: {}},
        {provide: MailProviderService, useValue: mailProviderServiceMock}
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
