import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {
  UserRoleInput,
  CreateUserRole,
  UserRoleList,
  UserRole,
  UpdateUserRole,
  DeleteUserRole,
  PermissionList
} from '../api/private'
import {Permission} from '../../src'

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

describe('User Roles', () => {
  describe('can be created/edited/deleted:', () => {
    const ids: string[] = []
    let permissionsList: Permission[]
    let permissionIDs: string[]

    beforeEach(async () => {
      const {mutate} = testClientPrivate
      const input: UserRoleInput = {
        name: `Role${ids.length}`,
        description: 'User Role',
        permissionIDs: []
      }
      const res = await mutate({
        mutation: CreateUserRole,
        variables: {
          input: input
        }
      })
      ids.unshift(res.data?.createUserRole?.id)
    })

    test('can read permission list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: PermissionList
      })
      expect(res).toMatchSnapshot()

      permissionsList = res.data?.permissions
      permissionIDs = permissionsList.map((permission: Permission) => permission.id)
    })

    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const input: UserRoleInput = {
        name: `Role${ids.length}`,
        description: 'New Role',
        permissionIDs: permissionIDs
      }

      const res = await mutate({
        mutation: CreateUserRole,
        variables: {
          input: input
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          createUserRole: {
            id: expect.any(String)
          }
        }
      })
      ids.unshift(res.data?.createUserRole?.id)
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: UserRoleList,
        variables: {
          first: 100
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          userRoles: {
            nodes: Array.from({length: ids.length + 3}, () => ({
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
      expect(res.data?.userRoles?.totalCount).toBe(ids.length + 3)
    })

    test('can be read by id', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: UserRole,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          userRole: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can be updated', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: UpdateUserRole,
        variables: {
          input: {
            name: 'UpdatedRole',
            description: 'Updated Role',
            permissionIDs: [permissionIDs[0], permissionIDs[3]]
          },
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          updateUserRole: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can be deleted', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: DeleteUserRole,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          deleteUserRole: expect.any(String)
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
