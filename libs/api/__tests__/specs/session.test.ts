import {ApolloServer} from 'apollo-server-express'
import jwt, {SignOptions} from 'jsonwebtoken'
import {CreateSession, CreateSessionWithJwt, Me} from '../api/private'
import {
  CreateSession as CreateSessionPublic,
  CreateSessionWithJwt as CreateSessionWithJwtPublic
} from '../api/public'

import {createGraphQLTestClientWithPrisma} from '../utility'

let testServerPublic: ApolloServer
let testServerPrivate: ApolloServer

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testServerPublic = setupClient.testServerPublic
    testServerPrivate = setupClient.testServerPrivate
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Sessions', () => {
  describe('Admin API', () => {
    test('can be created via mail and password', async () => {
      const res = await testServerPrivate.executeOperation({
        query: CreateSession,
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
      const userRes = await testServerPrivate.executeOperation({
        query: Me
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

      const res = await testServerPrivate.executeOperation({
        query: CreateSessionWithJwt,
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
      const res = await testServerPublic.executeOperation({
        query: CreateSessionPublic,
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
      const userRes = await testServerPrivate.executeOperation({
        query: Me
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

      const res = await testServerPublic.executeOperation({
        query: CreateSessionWithJwtPublic,
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
