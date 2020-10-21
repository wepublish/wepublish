import React from 'react'
import {MockedProvider} from '@apollo/client/testing'
import {UserRoleEditPanel} from '../../src/client/panel/userRoleEditPanel'
import {UserRoleDocument, PermissionListDocument} from '../../src/client/api'
import Enzyme, {mount} from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

// React 16 Enzyme adapter
Enzyme.configure({adapter: new Adapter()})

import {UIProvider /*, Select*/} from '@karma.run/ui'
import {act} from 'react-dom/test-utils'
import * as fela from 'fela'

// https://github.com/wesbos/waait/blob/master/index.js
export function wait(amount = 0) {
  return new Promise(resolve => setTimeout(resolve, amount))
}

// Use this in your test after mounting if you need just need to let the query finish without updating the wrapper
export async function actWait(amount = 0) {
  await act(async () => {
    await wait(amount)
  })
}

// Use this in your test after mounting if you want the query to finish and update the wrapper
export async function updateWrapper(wrapper: Enzyme.ReactWrapper, amount = 0) {
  await act(async () => {
    await wait(amount)
    wrapper.update()
  })
}

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
          permissions: []
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
  const mocks = [permissionListQuery]
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
  const mocks = [userRoleDocumentQuery, permissionListQuery]
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
