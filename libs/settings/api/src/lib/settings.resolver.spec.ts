import {Test, TestingModule} from '@nestjs/testing'
import {INestApplication, Module} from '@nestjs/common'
import request from 'supertest'
import * as crypto from 'crypto'
import {GraphQLModule} from '@nestjs/graphql'
import {PrismaClient, Prisma} from '@prisma/client'
import {ApolloDriverConfig, ApolloDriver} from '@nestjs/apollo'
import {PrismaModule} from '@wepublish/nest-modules'
import {SettingsResolver} from './settings.resolver'
import {SettingsService} from './settings.service'
import {AuthenticationModule, AuthenticationGuard} from '@wepublish/authentication/api'
import {GraphQLSettingValueType} from './settings.model'

export const generateRandomString = () => crypto.randomBytes(20).toString('hex')

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/',
      cache: 'bounded'
    }),
    PrismaModule,
    AuthenticationModule
  ],
  providers: [SettingsResolver, SettingsService, GraphQLSettingValueType]
})
export class AppModule {}

const settingsListQuery = `
  query settingsList($filter: SettingFilter) {
    settingsList {
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
      settingRestriction
    }
  }
`

const updateSettingsMutation = `
  mutation updateSettings($value: [UpdateSettingInput!]!) {
    updateSettings(value: $input) {
      value
    }
  }
`

const mockSetting: Prisma.SettingCreateInput = {
  id: generateRandomString(),
  name: generateRandomString(),
  value: 'mock-setting-value',
  settingRestriction: ''
}

const mockUser = {
  type: 'user',
  id: 'random-user-id',
  token: 'some-token',
  user: {roleIDs: [], id: 'random-role-id'},
  roles: []
}

class MockAuthenticationGuard extends AuthenticationGuard {
  public override handleRequest(): any {
    return mockUser
  }
}

describe('SettingsResolver', () => {
  let app: INestApplication
  let prisma: PrismaClient

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideGuard(AuthenticationGuard)
      .useClass(MockAuthenticationGuard)
      .compile()

    prisma = module.get<PrismaClient>(PrismaClient)
    app = module.createNestApplication()
    await app.init()

    // Create mock setting data
    await prisma.setting.create({data: mockSetting})
  })

  afterAll(async () => {
    await app.close()
  })

  test('settingsList query', async () => {
    await request(app.getHttpServer())
      .post('')
      .send({
        query: settingsListQuery,
        variables: {filter: {}}
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.settingsList).toHaveLength(1)
        expect(res.body.data.settingsList[0].name).toBe('mock-setting-name')
      })
  })

  // test('setting query', async () => {
  //   await request(app.getHttpServer())
  //     .post('/')
  //     .send({
  //       query: settingQuery,
  //       variables: {
  //         id: mockSetting.id
  //       }
  //     })
  //     .expect(200)
  //     .expect(res => {
  //       expect(res.body.data.setting).toMatchObject({
  //         id: expect.any(String),
  //         name: 'mock-setting-name',
  //         value: 'mock-setting-value'
  //       })
  //     })
  // })

  test('updateSettings mutation', async () => {
    const newValue = 'updated-mock-setting-value'

    await request(app.getHttpServer())
      .post('')
      .send({
        query: updateSettingsMutation,
        variables: {
          value: [
            {
              name: 'mock-setting-name',
              value: newValue
            }
          ]
        }
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.updateSettings[0].value).toBe(newValue)
      })
  })
})
