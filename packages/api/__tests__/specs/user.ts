import {ApolloServerTestClient} from 'apollo-server-testing'
import {
  CreateSession,
  CreateUser,
  DeleteUser,
  ResetUserPassword,
  UpdateUser,
  User,
  UserInput,
  UserList
} from '../api/private'

import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'

let testClientPrivate: ApolloServerTestClient

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testClientPrivate = setupClient.testClientPrivate
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Users', () => {
  describe('can be created/updated/edited/deleted:', () => {
    const ids: string[] = []

    beforeAll(async () => {
      const {mutate} = testClientPrivate
      const input: UserInput = {
        name: 'Bruce Wayne',
        email: `${generateRandomString()}@wepublish.ch`,
        emailVerifiedAt: new Date().toISOString(),
        properties: [],
        active: true,
        roleIDs: []
      }
      const res = await mutate({
        mutation: CreateUser,
        variables: {
          input: input,
          password: 'p@$$w0rd'
        }
      })

      ids.unshift(res.data.createUser.id)
    })

    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const input: UserInput = {
        name: 'Robin Wayne',
        email: `${generateRandomString()}@wepublish.ch`,
        emailVerifiedAt: new Date().toISOString(),
        properties: [],
        active: true,
        roleIDs: []
      }

      const res = await mutate({
        mutation: CreateUser,
        variables: {
          input: input,
          password: 'pwd123'
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          createUser: {
            id: expect.any(String),
            email: expect.any(String),
            emailVerifiedAt: expect.any(String)
          }
        }
      })
      ids.unshift(res.data.createUser.id)
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: UserList,
        variables: {
          take: 100
        }
      })

      expect(res.data.users.nodes).not.toHaveLength(0)
    })

    test('can be read by id', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: User,
        variables: {
          id: ids[0]
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          user: {
            id: expect.any(String),
            email: expect.any(String),
            emailVerifiedAt: expect.any(String)
          }
        }
      })
    })

    test('can be updated', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: UpdateUser,
        variables: {
          input: {
            name: 'Dark Knight',
            email: `${generateRandomString()}@wepublish.ch`,
            emailVerifiedAt: null,
            properties: [],
            active: true,
            roleIDs: []
          },
          id: ids[0]
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          updateUser: {
            id: expect.any(String),
            email: expect.any(String)
          }
        }
      })
    })

    test('can reset user password', async () => {
      const {mutate} = testClientPrivate

      const input: UserInput = {
        name: 'Robin Wayne',
        email: `${generateRandomString()}@wepublish.ch`,
        emailVerifiedAt: new Date().toISOString(),
        properties: [],
        active: true,
        roleIDs: []
      }

      const createdUser = await mutate({
        mutation: CreateUser,
        variables: {
          input: input,
          password: 'p@$$w0rd'
        }
      })

      const sessionRes = await mutate({
        mutation: CreateSession,
        variables: {
          email: input.email,
          password: 'p@$$w0rd'
        }
      })

      expect(sessionRes).toMatchSnapshot({
        data: {
          createSession: {
            token: expect.any(String),
            user: expect.objectContaining({
              email: expect.any(String)
            })
          }
        }
      })

      const resetPwdRes = await mutate({
        mutation: ResetUserPassword,
        variables: {
          id: createdUser.data.createUser.id,
          password: 'NewUpdatedPassword321'
        }
      })

      expect(resetPwdRes).toMatchSnapshot({
        data: {
          resetUserPassword: {
            id: expect.any(String),
            email: expect.any(String),
            emailVerifiedAt: expect.any(String)
          }
        }
      })

      const updatedPwdSession = await mutate({
        mutation: CreateSession,
        variables: {
          email: input.email,
          password: 'NewUpdatedPassword321'
        }
      })

      expect(updatedPwdSession).toMatchSnapshot({
        data: {
          createSession: {
            token: expect.any(String),
            user: expect.objectContaining({
              email: expect.any(String)
            })
          }
        }
      })
    })

    test('can be deleted', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: DeleteUser,
        variables: {
          id: ids[0]
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          deleteUser: {
            id: expect.any(String),
            email: expect.any(String)
          }
        }
      })

      ids.shift()
    })
  })
})
