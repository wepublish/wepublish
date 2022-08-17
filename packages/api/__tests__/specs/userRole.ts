import {ApolloServerTestClient} from 'apollo-server-testing'
import {Permission} from '../../src'
import {
  CreateUserRole,
  DeleteUserRole,
  PermissionList,
  UpdateUserRole,
  UserRole,
  UserRoleInput,
  UserRoleList
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

describe('User Roles', () => {
  describe('can be created/edited/deleted:', () => {
    const ids: string[] = []
    let permissionsList: Permission[]
    let permissionIDs: string[]

    beforeAll(async () => {
      const {mutate} = testClientPrivate
      const input: UserRoleInput = {
        name: generateRandomString(),
        description: 'User Role',
        permissionIDs: []
      }
      const res = await mutate({
        mutation: CreateUserRole,
        variables: {
          input: input
        }
      })
      ids.unshift(res.data.createUserRole.id)
    })

    test('can read permission list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: PermissionList
      })
      expect(res).toMatchSnapshot()

      permissionsList = res.data.permissions
      permissionIDs = permissionsList.map((permission: Permission) => permission.id)
    })

    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const input: UserRoleInput = {
        name: generateRandomString(),
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
            id: expect.any(String),
            name: expect.any(String)
          }
        }
      })
      ids.unshift(res.data.createUserRole.id)
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: UserRoleList,
        variables: {
          take: 100
        }
      })

      expect(res.data.userRoles.nodes).not.toHaveLength(0)
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
            id: expect.any(String),
            name: expect.any(String)
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
            name: generateRandomString(),
            description: 'Updated Role',
            permissionIDs: [permissionIDs[0], permissionIDs[3]]
          },
          id: ids[0]
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          updateUserRole: {
            id: expect.any(String),
            name: expect.any(String)
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
          deleteUserRole: expect.any(Object)
        }
      })
      expect(res.data.deleteUserRole.id).toBe(ids[0])
      ids.shift()
    })
  })
})
