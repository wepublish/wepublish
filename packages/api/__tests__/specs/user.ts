import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {
  UserInput,
  CreateUser,
  UserList,
  User,
  UpdateUser,
  ResetUserPassword,
  DeleteUser,
  CreateSession
} from '../api/private'

let testClientPublic: ApolloServerTestClient
let testClientPrivate: ApolloServerTestClient
let dbAdapter: MongoDBAdapter

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithMongoDB()
    testClientPublic = setupClient.testClientPublic
    testClientPrivate = setupClient.testClientPrivate
    dbAdapter = setupClient.dbAdapter

    console.log('public', testClientPublic)
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Users', () => {
  describe('can be created/updated/edited/deleted:', () => {
    const ids: string[] = []
    beforeEach(async () => {
      const {mutate} = testClientPrivate
      const input: UserInput = {
        name: 'Bruce Wayne',
        email: `bwayne@mymail${ids.length}.com`,
        roleIDs: []
      }
      const res = await mutate({
        mutation: CreateUser,
        variables: {
          input: input,
          password: 'p@$$w0rd'
        }
      })
      ids.unshift(res.data?.createUser?.id)
    })

    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const input: UserInput = {
        name: 'Robin Wayne',
        email: `rwayne@mymail${ids.length}.com`,
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
            id: expect.any(String)
          }
        }
      })
      ids.unshift(res.data?.createUser?.id)
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: UserList,
        variables: {
          first: 100
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          users: {
            nodes: Array.from({length: ids.length + 1}, () => ({
              id: expect.any(String)
            })),
            pageInfo: {
              endCursor: expect.any(String),
              startCursor: expect.any(String)
            },
            totalCount: expect.any(Number)
          }
        }
      })
      expect(res.data?.users?.totalCount).toBe(ids.length + 1)
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
            id: expect.any(String)
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
            email: 'batman@email.com',
            roleIDs: []
          },
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          updateUser: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can reset user password', async () => {
      const {mutate} = testClientPrivate

      const sessionRes = await mutate({
        mutation: CreateSession,
        variables: {
          email: `bwayne@mymail5.com`,
          password: 'p@$$w0rd'
        }
      })
      expect(sessionRes).toMatchSnapshot({
        data: {
          createSession: {
            token: expect.any(String)
          }
        }
      })

      const resetPwdRes = await mutate({
        mutation: ResetUserPassword,
        variables: {
          id: ids[0],
          password: 'NewUpdatedPassword321'
        }
      })
      expect(resetPwdRes).toMatchSnapshot({
        data: {
          resetUserPassword: {
            id: expect.any(String)
          }
        }
      })

      const updatedPwdSession = await mutate({
        mutation: CreateSession,
        variables: {
          email: `bwayne@mymail5.com`,
          password: 'NewUpdatedPassword321'
        }
      })
      expect(updatedPwdSession).toMatchSnapshot({
        data: {
          createSession: {
            token: expect.any(String)
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
          deleteUser: expect.any(String)
        }
      })
      ids.shift()
    })
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
