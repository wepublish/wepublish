import React from 'react'
import {UserRoleEditPanel} from '../../src/client/panel/userRoleEditPanel'
import {
  UserRoleDocument,
  PermissionListDocument,
  CreateUserRoleDocument
} from '../../src/client/api'
import {mount} from 'enzyme'

import {updateWrapper} from '../utils'
import {act} from 'react-dom/test-utils'
import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'

const MockedProvider = MockedProviderBase as any

const userRoleDocumentQuery = {
  request: {
    query: UserRoleDocument,
    variables: {
      id: 'roleId1'
    }
  },
  result: () => {
    return {
      data: {
        userRole: {
          __typename: 'UserRole',
          id: 'roleId1',
          name: 'Role 1',
          description: 'Description for role 1',
          systemRole: false,
          permissions: [
            {
              __typename: 'Permission',
              id: 'permissionId1',
              description: 'permission description 1',
              checked: true,
              deprecated: false
            },
            {
              __typename: 'Permission',
              id: 'permissionId2',
              description: 'permission description 2',
              checked: false,
              deprecated: false
            },
            {
              __typename: 'Permission',
              id: 'permissionId3',
              description: 'permission description 3',
              checked: false,
              deprecated: false
            },
            {
              __typename: 'Permission',
              id: 'permissionId4',
              description: 'permission description 4',
              checked: true,
              deprecated: false
            }
          ]
        }
      }
    }
  }
}

// mock user role
const permissionListQuery = {
  request: {
    query: PermissionListDocument
  },
  result: () => {
    return {
      data: {
        permissions: permissions
      }
    }
  }
}

const permissions = [
  {
    __typename: 'Permission',
    id: 'permissionId1',
    description: 'permission description 1',
    checked: false,
    deprecated: false
  },
  {
    __typename: 'Permission',
    id: 'permissionId2',
    description: 'permission description 2',
    checked: false,
    deprecated: false
  },
  {
    __typename: 'Permission',
    id: 'permissionId3',
    description: 'permission description 3',
    checked: false,
    deprecated: false
  },
  {
    __typename: 'Permission',
    id: 'permissionId4',
    description: 'permission description 4',
    checked: false,
    deprecated: false
  }
]

describe('User Role Edit Panel', () => {
  test('should render', async () => {
    const mocks = [permissionListQuery]
    const wrapper = mount(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserRoleEditPanel />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    const panel = wrapper.find('UserRoleEditPanel')
    expect(panel).toMatchSnapshot()
  })

  test('should render with role', async () => {
    const mocks = [userRoleDocumentQuery, permissionListQuery]
    const wrapper = mount(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserRoleEditPanel id={'roleId1'} />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    const panel = wrapper.find('UserRoleEditPanel')
    expect(panel).toMatchSnapshot()
  })

  test('should have Toggle sliders disabled with System Role', async () => {
    userRoleDocumentQuery.result = () => {
      return {
        data: {
          userRole: {
            __typename: 'UserRole',
            id: 'roleId1',
            name: 'Role 1',
            description: 'Description for role 1',
            systemRole: true,
            permissions: [
              {
                __typename: 'Permission',
                id: 'permissionId1',
                description: 'permission description 1',
                checked: true,
                deprecated: false
              },
              {
                __typename: 'Permission',
                id: 'permissionId2',
                description: 'permission description 2',
                checked: false,
                deprecated: false
              }
            ]
          }
        }
      }
    }
    const mocks = [userRoleDocumentQuery, permissionListQuery]
    const wrapper = mount(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserRoleEditPanel id={'roleId1'} />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    const panel = wrapper.find('UserRoleEditPanel')
    expect(panel).toMatchSnapshot()
  })

  test('should allow a new role to be created', async () => {
    const userRole = {
      __typename: 'UserRole',
      id: 'fakeId4',
      name: 'Brand New User Role',
      description: 'A user role to be added to snapshot',
      systemRole: false
    }
    const mocks = [
      {
        request: {
          query: CreateUserRoleDocument,
          variables: {
            input: {
              name: userRole.name,
              description: userRole.description,
              permissionIDs: []
            }
          }
        },
        result: () => ({
          data: {
            userRole: {
              __typename: userRole.__typename,
              id: userRole.id,
              name: userRole.description,
              description: userRole.description,
              systemRole: userRole.systemRole,
              permissions: []
            }
          }
        })
      },
      permissionListQuery
    ]

    const wrapper = mount(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserRoleEditPanel />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    act(() => {
      wrapper
        .find('input[name="userRoles.panels.name"]')
        .simulate('change', {target: {value: userRole.name}})
      wrapper
        .find('input[name="userRoles.panels.description"]')
        .simulate('change', {target: {value: userRole.description}})
    })

    wrapper.find('button[className="rs-btn rs-btn-primary"]').simulate('click')

    const panel = wrapper.find('UserRoleEditPanel')
    expect(panel).toMatchSnapshot()
  })
})
