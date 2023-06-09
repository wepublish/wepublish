import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {fireEvent, render} from '@testing-library/react'
import {
  CreateUserRoleDocument,
  PermissionListDocument,
  UserRoleDocument
} from '@wepublish/editor/api'
import {AuthContext} from '@wepublish/ui/editor'
import React from 'react'
import snapshotDiff from 'snapshot-diff'

import {UserRoleEditPanel} from '../../src/app/panel/userRoleEditPanel'
import {actWait, sessionWithPermissions} from '../utils'

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
        permissions
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
    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <UserRoleEditPanel />
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
  })

  test('should render with role', async () => {
    const mocks = [userRoleDocumentQuery, permissionListQuery]
    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <UserRoleEditPanel id={'roleId1'} />
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
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
    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <UserRoleEditPanel id={'roleId1'} />
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
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

    const {asFragment, getByTestId, getByLabelText} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <UserRoleEditPanel />
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()
    const initialRender = asFragment()
    const nameInput = getByLabelText('userRoles.panels.name*')
    const descriptionInput = getByLabelText('userRoles.panels.description')
    const saveButton = getByTestId('saveButton')

    fireEvent.change(nameInput, {
      target: {value: userRole.name}
    })
    fireEvent.change(descriptionInput, {
      target: {value: userRole.description}
    })
    fireEvent.click(saveButton)

    expect(snapshotDiff(initialRender, asFragment())).toMatchSnapshot()
  })

  const sessionWithoutPermission = {
    session: {
      email: 'user@abc.ch',
      sessionToken: 'abcdefg',
      sessionRoles: [
        {
          id: 'user',
          description: 'User',
          name: 'user',
          systemRole: true,
          permissions: []
        }
      ]
    }
  }

  test('will not render without correct permission', () => {
    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithoutPermission}>
        <MockedProvider addTypename={false}>
          <UserRoleEditPanel id={'roleId1'} />
        </MockedProvider>
      </AuthContext.Provider>
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
