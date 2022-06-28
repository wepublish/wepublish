import {ApolloServerTestClient} from 'apollo-server-testing'
import jwt, {SignOptions} from 'jsonwebtoken'
import {CreateSession, CreateSessionWithJwt, Me} from '../api/private'
import {
  CreateSession as CreateSessionPublic,
  CreateSessionWithJwt as CreateSessionWithJwtPublic
} from '../api/public'

import {createGraphQLTestClientWithMongoDB} from '../utility'

let testClientPublic: ApolloServerTestClient
let testClientPrivate: ApolloServerTestClient

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithMongoDB()
    testClientPublic = setupClient.testClientPublic
    testClientPrivate = setupClient.testClientPrivate
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
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

    test('can be create via JWT', async () => {
      const {mutate} = testClientPrivate

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

      if (!process.env.JWT_SECRET_KEY) {
        throw Error('JWT_SECRET_KEY needed for tests')
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

    test('can be create via JWT', async () => {
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

      if (!process.env.JWT_SECRET_KEY) {
        throw Error('JWT_SECRET_KEY needed for tests')
      }

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

    // TODO: write test for oauth auth
  })
})
