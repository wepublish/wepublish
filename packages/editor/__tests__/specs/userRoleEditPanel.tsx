import React from 'react'
import {MockedProvider} from '@apollo/client/testing'
import {UserRoleEditPanel} from '../../src/client/panel/userRoleEditPanel'
import {UserRoleListDocument, PermissionListDocument} from '../../src/client/api'
import Enzyme, {mount} from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

// React 16 Enzyme adapter
Enzyme.configure({adapter: new Adapter()})

import {UIProvider /*, Select*/} from '@karma.run/ui'
import * as fela from 'fela'
import {updateWrapper} from '../utils'

const styleRenderer: fela.IRenderer = {
  renderRule: jest.fn(),
  renderKeyframe: jest.fn(),
  renderFont: jest.fn(),
  renderStatic: jest.fn(),
  renderToString: jest.fn(),
  subscribe: jest.fn(),
  clear: jest.fn()
}

const userRoleListDocumentQuery = {
  request: {
    query: UserRoleListDocument,
    variables: {
      first: 200
    }
  },
  result: () => {
    return {
      data: {
        userRoles: {
          nodes: [
            {
              __typename: 'UserRole',
              id: 'roleId1',
              name: 'Role 1',
              description: 'Description for role 1',
              systemRole: false,
              permissions: []
            },
            {
              __typename: 'UserRole',
              id: 'roleId2',
              name: 'Role 2',
              description: 'Description for role 2',
              systemRole: false,
              permissions: []
            },
            {
              __typename: 'UserRole',
              id: 'roleId3',
              name: 'Admin',
              description: 'Description for role 3',
              systemRole: false,
              permissions: []
            }
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false
          },
          totalCount: 0
        }
      }
    }
  }
}

//mock user role
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
  const mocks = [userRoleListDocumentQuery, permissionListQuery]
  const wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserRoleEditPanel />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  expect(wrapper).toMatchSnapshot()
})

test('Role Panel should render with role', async () => {
  const mocks = [userRoleListDocumentQuery, permissionListQuery]
  const wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserRoleEditPanel id={'roleId1'} />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  expect(wrapper).toMatchSnapshot()
})
//TODO test render existing user role panel without system role
//TODO test render existing user role panel with system role true - slider buttons should be disabled
