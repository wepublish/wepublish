import {INestApplication} from '@nestjs/common'
import {Test, TestingModule} from '@nestjs/testing'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {UserRoleService} from './user-role.service'
import {UserRoleResolver} from './user-role.resolver'
import request from 'supertest'
import {expect} from '@storybook/jest'
import {
  CanCreateArticle,
  CanDeleteBlockStyle,
  CanDeleteEvent,
  PermissionDataloader
} from '@wepublish/permissions/api'
import {PaginatedUserRoles, UserRole} from './user-role.model'
import {UserRoleDataloader} from './user-role.dataloader'

const userRoleQueryById = `
  query GetUserRoleById($id: ID!) {
    getUserRoleById(id: $id) {
      id
      name
      permissions {
        id
        description
      }
    }
  }
`

const userRoleListQuery = `
  query GetUserRoles($filter: UserRoleFilter, $skip: Int, $take: Int, $cursorId: ID) {
    getUserRoles(filter: $filter, skip: $skip, take: $take, cursorId: $cursorId) {
      nodes {
        id
        name
        permissions {
          id
          description
        }
      }
      totalCount
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
`

const createUserRoleMutation = `
  mutation CreateUserRole($userRole: CreateUserRoleInput!) {
    createUserRole(userRole: $userRole) {
      id
      name
    }
  }
`

const updateUserRoleMutation = `
  mutation UpdateUserRole($userRole: UpdateUserRoleInput!) {
    updateUserRole(userRole: $userRole) {
      id
      name
    }
  }
`

const deleteUserRoleMutation = `
  mutation DeleteUserRole($id: ID!) {
    deleteUserRole(id: $id) {
      id
    }
  }
`

describe('UserRoleResolver', () => {
  let app: INestApplication
  let userRoleServiceMock: {[method in keyof UserRoleService]?: jest.Mock}
  let userRoleDataloader: {[method in keyof UserRoleDataloader]?: jest.Mock}

  beforeEach(async () => {
    userRoleServiceMock = {
      getUserRoleById: jest.fn(),
      getUserRoles: jest.fn(),
      createUserRole: jest.fn(),
      updateUserRole: jest.fn(),
      deleteUserRoleById: jest.fn()
    }

    userRoleDataloader = {
      load: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/'
        })
      ],
      providers: [
        UserRoleResolver,
        {provide: UserRoleDataloader, useValue: userRoleDataloader},
        {provide: UserRoleService, useValue: userRoleServiceMock},
        {provide: PermissionDataloader, useValue: new PermissionDataloader()}
      ]
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('Query: getUserRole by id', async () => {
    const mockResponse = {
      id: '1',
      name: 'Admin',
      permissionIDs: [CanCreateArticle.id, CanDeleteBlockStyle.id]
    } as UserRole
    userRoleServiceMock.getUserRoleById?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: userRoleQueryById,
        variables: {id: '1'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getUserRole by id: Not found', async () => {
    userRoleServiceMock.getUserRoleById?.mockResolvedValue(null)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: userRoleQueryById,
        variables: {id: 'not-found'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getUserRoles list', async () => {
    const mockResponse = {
      nodes: [{id: '1', name: 'Admin', permissionIDs: [CanDeleteEvent.id]}],
      totalCount: 1,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: '1',
        endCursor: '1'
      }
    } as PaginatedUserRoles
    userRoleServiceMock.getUserRoles?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: userRoleListQuery,
        variables: {filter: {}, skip: 0, take: 10, cursorId: null}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(userRoleServiceMock.getUserRoles).toHaveBeenCalled()
      })
      .expect(200)
  })

  test('Mutation: createUserRole', async () => {
    const userRole = {name: 'Editor', permissionIDs: []}
    const mockResponse = {id: '2', name: 'Editor', permissionIDs: []}
    userRoleServiceMock.createUserRole?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: createUserRoleMutation,
        variables: {userRole}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(userRoleServiceMock.createUserRole).toHaveBeenCalledWith(userRole)
      })
      .expect(200)
  })

  test('Mutation: updateUserRole', async () => {
    const userRole = {id: '1', name: 'Super Admin'}
    const mockResponse = {id: '1', name: 'Super Admin'}
    userRoleServiceMock.updateUserRole?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: updateUserRoleMutation,
        variables: {userRole}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(userRoleServiceMock.updateUserRole).toHaveBeenCalledWith(userRole)
      })
      .expect(200)
  })

  test('Mutation: deleteUserRole', async () => {
    const mockId = '1'
    const mockResponse = {id: '1'}
    userRoleServiceMock.deleteUserRoleById?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: deleteUserRoleMutation,
        variables: {id: mockId}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(userRoleServiceMock.deleteUserRoleById).toHaveBeenCalledWith(mockId)
      })
      .expect(200)
  })
})
