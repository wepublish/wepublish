import {Test, TestingModule} from '@nestjs/testing'
import {INestApplication, Module} from '@nestjs/common'
import request from 'supertest'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriverConfig, ApolloDriver} from '@nestjs/apollo'
import {PrismaClient, Prisma, UserConsent} from '@prisma/client'
import {PrismaModule} from '@wepublish/nest-modules'
import {UserConsentResolver} from './user-consent.resolver'
import {UserConsentService} from './user-consent.service'
import {AuthenticationModule, AuthenticationGuard} from '@wepublish/authentication/api'
import {generateRandomString} from '../consent/consent.resolver.spec'

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
  providers: [UserConsentResolver, UserConsentService]
})
export class AppModule {}

const userConsentQuery = `
  query userConsent($id: String!) {
    userConsent(id: $id) {
      id
      value
      createdAt
      modifiedAt
      consent {
        slug
        id
        name
      }
      user {
        id
        name
        firstName
        email
      }
    }
  }
`

const createUserConsentMutation = `
  mutation createUserConsent($userConsent: UserConsentInput!) {
    createUserConsent(userConsent: $userConsent) {
      id
      value
    }
  }
`

const updateUserConsentMutation = `
  mutation updateUserConsent($id: String!, $userConsent: UpdateUserConsentInput!) {
    updateUserConsent(id: $id, userConsent: $userConsent) {
      id
      value
      createdAt
      modifiedAt
      consent {
        slug
        id
        name
      }
      user {
        id
        name
        firstName
        email
      }
    }
  }
`

const deleteUserConsentMutation = `
  mutation deleteUserConsent($id: String!) {
    deleteUserConsent(id: $id) {
      id
    }
  }
`

const mockSlug1 = generateRandomString()

export const mockUserConsents: Prisma.UserConsentCreateInput[] = [
  {
    consent: {
      connectOrCreate: {
        where: {id: '448c86d8-9df1-4836-9ae9-aa2668ef9dcd'},
        create: {
          name: 'some-name',
          slug: mockSlug1,
          defaultValue: true
        }
      }
    },
    value: true,
    user: {
      connectOrCreate: {
        where: {id: 'some-id'},
        create: {
          name: 'some-name',
          email: `${generateRandomString()}@wepublish.ch`,
          password: 'some-password',
          active: true
        }
      }
    }
  }
]

const mockUser = {
  type: 'user',
  id: '448c86d8-9df1-4836-9ae9-aa2668ef9dcd',
  token: 'some-token',
  user: {roleIDs: [{}], id: 'clf870cla0719q1rx6vg0y2rj'},
  roles: [{}]
}

class MockAuthenticationGuard extends AuthenticationGuard {
  public override handleRequest(): any {
    return mockUser
  }
}

describe('UserConsentResolver', () => {
  let app: INestApplication
  let prisma: PrismaClient
  let userConsents: UserConsent[] = []

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

    userConsents = await Promise.all(
      mockUserConsents.map(data => prisma.userConsent.create({data}))
    )
  })

  afterAll(async () => {
    await app.close()
  })

  test('user consent query', async () => {
    const idToGet = userConsents[0].id

    await request(app.getHttpServer())
      .post('')
      .send({
        query: userConsentQuery,
        variables: {
          id: idToGet
        }
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.userConsent).toMatchObject({
          id: expect.any(String),
          consent: expect.any(Object),
          value: true,
          user: expect.any(Object)
        })
      })
  })

  test('create user consent mutation', async () => {
    const createdUser = await prisma.user.create({
      data: {
        name: 'some-name3',
        email: generateRandomString(),
        password: 'some-password3',
        active: true
      }
    })

    const createdConsent = await prisma.consent.create({
      data: {
        name: 'some-name3',
        slug: generateRandomString(),
        defaultValue: true
      }
    })

    mockUser.user.id = createdUser.id

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: createUserConsentMutation,
        variables: {
          userConsent: {
            consentId: createdConsent.id,
            userId: createdUser.id,
            value: true
          }
        }
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.createUserConsent).toMatchObject({
          id: expect.any(String),
          value: true
        })
      })
  })

  test('update user consent mutation', async () => {
    const idToUpdate = userConsents[0].id
    mockUser.user.id = userConsents[0].userId

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: updateUserConsentMutation,
        variables: {
          id: idToUpdate,
          userConsent: {
            value: false
          }
        }
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.updateUserConsent).toMatchObject({
          id: expect.any(String)
        })
      })
  })

  test('delete user consent mutation', async () => {
    const idToDelete = userConsents[0].id
    mockUser.user.id = userConsents[0].userId

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: deleteUserConsentMutation,
        variables: {
          id: idToDelete
        }
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.deleteUserConsent).toMatchObject({
          id: userConsents[0].id
        })
      })
  })

  test('only allow updating consent for the authorized user', async () => {
    const idToUpdate = userConsents[0].id

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: updateUserConsentMutation,
        variables: {
          id: idToUpdate,
          userConsent: {
            value: false
          }
        }
      })
      .expect(200)
      .expect(res => {
        expect(res.body.errors[0].message).toBe('Unauthorized')
      })
  })
})
