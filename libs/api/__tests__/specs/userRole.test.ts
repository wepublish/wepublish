import {Permission} from '@wepublish/permissions/api'
import {ApolloServer} from 'apollo-server-express'
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

let testServerPrivate: ApolloServer

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testServerPrivate = setupClient.testServerPrivate
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
      const input: UserRoleInput = {
        name: generateRandomString(),
        description: 'User Role',
        permissionIDs: []
      }
      const res = await testServerPrivate.executeOperation({
        query: CreateUserRole,
        variables: {
          input
        }
      })
      ids.unshift(res.data?.createUserRole.id)
    })

    test('can read permission list', async () => {
      const res = await testServerPrivate.executeOperation({
        query: PermissionList
      })
      expect(res).toMatchSnapshot()

      permissionsList = res.data?.permissions
      permissionIDs = permissionsList.map((permission: Permission) => permission.id)
    })

    test('can be created', async () => {
      const input: UserRoleInput = {
        name: generateRandomString(),
        description: 'New Role',
        permissionIDs
      }

      const res = await testServerPrivate.executeOperation({
        query: CreateUserRole,
        variables: {
          input
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
      ids.unshift(res.data?.createUserRole.id)
    })

    test('can be read in list', async () => {
      const res = await testServerPrivate.executeOperation({
        query: UserRoleList,
        variables: {
          take: 100
        }
      })

      expect(res.data?.userRoles.nodes).not.toHaveLength(0)
    })

    test('can be read by id', async () => {
      const res = await testServerPrivate.executeOperation({
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
      const res = await testServerPrivate.executeOperation({
        query: UpdateUserRole,
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
      const res = await testServerPrivate.executeOperation({
        query: DeleteUserRole,
        variables: {
          id: ids[0]
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          deleteUserRole: expect.any(Object)
        }
      })
      expect(res.data?.deleteUserRole.id).toBe(ids[0])
      ids.shift()
    })
  })
})
