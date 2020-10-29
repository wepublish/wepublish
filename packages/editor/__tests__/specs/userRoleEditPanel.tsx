import React from 'react'
import {MockedProvider} from '@apollo/client/testing'
import {UserRoleEditPanel} from '../../src/client/panel/userRoleEditPanel'
import {
  UserRoleDocument,
  PermissionListDocument,
  CreateUserRoleDocument
} from '../../src/client/api'
import Enzyme, {mount} from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

import {UIProvider} from '@karma.run/ui'
import * as fela from 'fela'
import {updateWrapper} from '../utils'
import {act} from 'react-dom/test-utils'

// React 16 Enzyme adapter
Enzyme.configure({adapter: new Adapter()})

const styleRenderer: fela.IRenderer = {
  renderRule: jest.fn(),
  renderKeyframe: jest.fn(),
  renderFont: jest.fn(),
  renderStatic: jest.fn(),
  renderToString: jest.fn(),
  subscribe: jest.fn(),
  clear: jest.fn()
}

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

test('Role Panel should render', async () => {
  const mocks = [permissionListQuery]
  const wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserRoleEditPanel />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  const panel = wrapper.find('UserRoleEditPanel')
  expect(panel).toMatchSnapshot()
})

test('Role Panel should render with role', async () => {
  const mocks = [userRoleDocumentQuery, permissionListQuery]
  const wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserRoleEditPanel id={'roleId1'} />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  const panel = wrapper.find('UserRoleEditPanel')
  expect(panel).toMatchSnapshot()
})

test('Toggle sliders should be disabled with System Role', async () => {
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
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserRoleEditPanel id={'roleId1'} />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  const panel = wrapper.find('UserRoleEditPanel')
  expect(panel).toMatchSnapshot()
})

test('User should be able to create a new role', async () => {
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
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserRoleEditPanel />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  act(() => {
    wrapper
      .find('input[placeholder="userRoles.panels.name"]')
      .simulate('change', {target: {value: userRole.name}})
    wrapper
      .find('input[placeholder="userRoles.panels.description"]')
      .simulate('change', {target: {value: userRole.description}})
  })

  await act(async () => {
    wrapper.find('button > Icon > MaterialIconSaveOutlined').simulate('click')
  })

  const panel = wrapper.find('UserRoleEditPanel')
  expect(panel).toMatchSnapshot()
})
