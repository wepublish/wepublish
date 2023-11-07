import {Test, TestingModule} from '@nestjs/testing'
import {INestApplication, Module} from '@nestjs/common'
import request from 'supertest'
import {GraphQLModule} from '@nestjs/graphql'
import {PrismaClient} from '@prisma/client'
import {ApolloDriverConfig, ApolloDriver} from '@nestjs/apollo'
import {PrismaModule} from '@wepublish/nest-modules'
import {SettingsResolver} from './settings.resolver'
import {SettingsService} from './settings.service'
import {GraphQLSettingValueType} from './settings.model'
import {SettingName} from './setting'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/',
      cache: 'bounded'
    }),
    PrismaModule
  ],
  providers: [SettingsResolver, SettingsService, GraphQLSettingValueType]
})
export class AppModule {}

const settingsListQuery = `
  query settingsList($filter: SettingFilter) {
    settingsList(filter: $filter) {
      id
      name
      value
      settingRestriction {
        maxValue
        minValue
        inputLength
        allowedValues {
          stringChoice
          boolChoice
        }
      }
    }
  }
`

const settingQuery = `
  query setting($id: String!) {
    setting(id: $id) {
      id
      name
      value
      settingRestriction {
        maxValue
        minValue
        inputLength
        allowedValues {
          stringChoice
          boolChoice
        }
      }
    }
  }
`

const updateSettingsMutation = `
  mutation updateSettings($value: [UpdateSettingInput!]!) {
    updateSettings(value: $value) {
      value
    }
  }
`

jest.mock('@prisma/client', () => {
  const mockSettingFindMany = jest.fn().mockResolvedValue([
    {
      id: '123',
      name: 'allowCommentEditing',
      value: true,
      settingRestriction: {
        maxValue: 100,
        minValue: 10,
        inputLength: 10,
        allowedValues: {
          stringChoice: 'some-string',
          boolChoice: true
        }
      }
    },
    {
      id: '123',
      name: 'allowGuestCommenting',
      value: true,
      settingRestriction: {
        maxValue: 100,
        minValue: 10,
        inputLength: 10,
        allowedValues: {
          stringChoice: 'some-string',
          boolChoice: true
        }
      }
    }
  ])
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        setting: {
          findMany: mockSettingFindMany
        }
      }
    })
  }
})

describe('SettingsResolver', () => {
  let app: INestApplication
  // let prisma: PrismaClient

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    // prisma = module.get<PrismaClient>(PrismaClient)
    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('settingsList query', async () => {
    // prisma.setting.findMany.mockResolvedValue([])

    await request(app.getHttpServer())
      .post('')
      .send({
        query: settingsListQuery,
        variables: {filter: {}}
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.settingsList).toHaveLength(2)
      })
  })

  // test('setting query', async () => {
  //   const settingToGet = await prisma.setting.findUnique({
  //     where: {name: SettingName.INVOICE_REMINDER_MAX_TRIES}
  //   })

  //   await request(app.getHttpServer())
  //     .post('/')
  //     .send({
  //       query: settingQuery,
  //       variables: {
  //         id: settingToGet!.id
  //       }
  //     })
  //     .expect(200)
  //     .expect(res => {
  //       expect(res.body.data.setting).toMatchObject({
  //         id: expect.any(String),
  //         name: 'INVOICE_REMINDER_MAX_TRIES',
  //         value: 5
  //       })
  //     })
  // })

  // test('updateSettings mutation', async () => {
  //   const newValue = 1000

  //   await request(app.getHttpServer())
  //     .post('')
  //     .send({
  //       query: updateSettingsMutation,
  //       variables: {
  //         value: [
  //           {
  //             name: 'PEERING_TIMEOUT_MS',
  //             value: 1000
  //           }
  //         ]
  //       }
  //     })
  //     .expect(200)
  //     .expect(res => {
  //       expect(res.body.data.updateSettings[0].value).toBe(newValue)
  //     })
  // })
})
