import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {
  CreateSession,
  Me,
  CreateSessionWithJwt,
  RevokeActiveSession,
  RevokeSession
} from '../api/private'
import {
  CreateSession as CreateSessionPublic,
  CreateSessionWithJwt as CreateSessionWithJwtPublic
} from '../api/public'
import jwt, {SignOptions} from 'jsonwebtoken'

let testClientPublic: ApolloServerTestClient
let testClientPrivate: ApolloServerTestClient
let dbAdapter: MongoDBAdapter
const OLD_ENV = process.env

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithMongoDB()
    testClientPublic = setupClient.testClientPublic
    testClientPrivate = setupClient.testClientPrivate
    dbAdapter = setupClient.dbAdapter
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

beforeEach(() => {
  jest.resetModules()
  process.env = {...OLD_ENV}
})

describe('Sessions', () => {
  describe('Admin API', () => {
    test('can be created via mail and password', async () => {
      const {mutate} = testClientPrivate

      const res = await mutate({
        mutation: CreateSession,
        variables: {
          email: 'dev@wepublish.ch',
          password: '123'
        }
      })
      const session = res.data?.createSession
      expect(session.user.email).toBe('dev@wepublish.ch')
      expect(session.token).toBeDefined()
    })

    test('can be created via JWT', async () => {
      const {mutate} = testClientPrivate

      process.env.JWT_SECRET_KEY = 'secretKey123'

      const userRes = await mutate({
        mutation: Me
      })

      const user = userRes.data?.me

      const jwtOptions: SignOptions = {
        issuer: 'https://fakeURL',
        audience: 'https://fakeURL',
        algorithm: 'HS256',
        expiresIn: `5m`
      }

      const token = jwt.sign({sub: user.id}, process.env.JWT_SECRET_KEY, jwtOptions)

      const res = await mutate({
        mutation: CreateSessionWithJwt,
        variables: {
          jwt: token
        }
      })

      const session = res.data?.createSessionWithJWT
      expect(session.user.email).toBe('dev@wepublish.ch')
      expect(session.token).toBeDefined()
    })

    test('token expires', async () => {
      const {mutate} = testClientPrivate

      process.env.JWT_SECRET_KEY = 'secretKey123'

      const userRes = await mutate({
        mutation: Me
      })

      const user = userRes.data?.me

      const jwtOptions: SignOptions = {
        issuer: 'https://fakeURL',
        audience: 'https://fakeURL',
        algorithm: 'HS256',
        expiresIn: `5`
      }

      const token = jwt.sign({sub: user.id}, process.env.JWT_SECRET_KEY, jwtOptions)

      const res = await mutate({
        mutation: CreateSessionWithJwt,
        variables: {
          jwt: token
        }
      })
      expect(res?.data).toBeNull()
      expect(res?.errors?.[0].message).toBe('jwt expired')
    })

    test('rejects session with undefined JWT env secret key', async () => {
      const {mutate} = testClientPrivate

      const res = await mutate({
        mutation: CreateSessionWithJwt,
        variables: {
          jwt: 'fakeToken'
        }
      })

      expect(res?.data).toBeNull()
      expect(res?.errors?.[0].message).toBe('No JWT_SECRET_KEY defined in environment.')
    })

    test('rejects false credentials', async () => {
      const {mutate} = testClientPrivate

      const res = await mutate({
        mutation: CreateSession,
        variables: {
          email: 'dev@wepublish.ch',
          password: '1234'
        }
      })
      expect(res?.data).toBeNull()
      expect(res?.errors?.[0].message).toBe('Invalid credentials')
    })

    // TODO: write test for oauth auth
  })

  describe('Public API', () => {
    test('can be created via mail and password', async () => {
      const {mutate} = testClientPublic

      const res = await mutate({
        mutation: CreateSessionPublic,
        variables: {
          email: 'dev@wepublish.ch',
          password: '123'
        }
      })
      const session = res.data?.createSession
      expect(session.user.email).toBe('dev@wepublish.ch')
      expect(session.token).toBeDefined()
    })

    test('can be created via JWT', async () => {
      const {mutate: mutateAdmin} = testClientPrivate
      const {mutate} = testClientPublic

      const userRes = await mutateAdmin({
        mutation: Me
      })

      const user = userRes.data?.me

      const jwtOptions: SignOptions = {
        issuer: 'https://fakeURL',
        audience: 'https://fakeURL',
        algorithm: 'HS256',
        expiresIn: `5m`
      }

      process.env.JWT_SECRET_KEY = 'secretKey123'

      const token = jwt.sign({sub: user.id}, process.env.JWT_SECRET_KEY, jwtOptions)

      const res = await mutate({
        mutation: CreateSessionWithJwtPublic,
        variables: {
          jwt: token
        }
      })

      const session = res.data?.createSessionWithJWT
      expect(session.user.email).toBe('dev@wepublish.ch')
      expect(session.token).toBeDefined()
    })

    test('rejects session with undefined JWT env secret key', async () => {
      const {mutate} = testClientPublic

      const res = await mutate({
        mutation: CreateSessionWithJwtPublic,
        variables: {
          jwt: 'fakeToken'
        }
      })

      expect(res?.data).toBeNull()
      expect(res?.errors?.[0].message).toBe('No JWT_SECRET_KEY defined in environment.')
    })

    // TODO: write test for oauth auth
  })

  test('can revoke session by ID', async () => {
    const {mutate} = testClientPrivate

    const session = await mutate({
      mutation: CreateSession,
      variables: {
        email: 'dev@wepublish.ch',
        password: '123'
      }
    })

    const id = session.data?.createSession.id

    const res = await mutate({
      mutation: RevokeSession,
      variables: {
        id: id
      }
    })

    expect(res.data?.revokeSession).toBe(true)
  })

  test('can revoke active session', async () => {
    const {mutate} = testClientPrivate

    const res = await mutate({mutation: RevokeActiveSession})

    expect(res.data?.revokeActiveSession).toBeTruthy()
  })
})

afterAll(async () => {
  process.env = OLD_ENV
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
