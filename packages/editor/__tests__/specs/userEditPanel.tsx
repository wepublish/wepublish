import React from 'react'
import {MockedProvider} from '@apollo/client/testing'
import {UserEditPanel} from '../../src/client/panel/userEditPanel'
import {UserDocument, CreateUserDocument, UserRoleListDocument} from '../../src/client/api'
import Enzyme, {mount} from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

// React 16 Enzyme adapter
Enzyme.configure({adapter: new Adapter()})

import {UIProvider /*, Select*/} from '@karma.run/ui'
import {act} from 'react-dom/test-utils'
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

const userDocumentQuery = {
  request: {
    query: UserDocument,
    variables: {
      id: 'fakeId3'
    }
  },
  result: () => ({
    data: {
      user: {
        __typename: 'User',
        id: 'fakeId3',
        name: 'Peter Parker',
        email: 'peter@parker.com',
        roles: [
          {
            __typename: 'UserRole',
            id: 'roleId1',
            name: 'Role 1',
            description: 'Description for role 1',
            systemRole: false,
            permissions: []
          }
        ]
      }
    }
  })
}

test('User Edit Panel should render', async () => {
  const mocks = [userRoleListDocumentQuery]
  const wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserEditPanel />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  const panel = wrapper.find('UserEditPanel')
  expect(panel).toMatchSnapshot()
})

test('User Edit Panel should render with id', async () => {
  const mocks = [userDocumentQuery, userRoleListDocumentQuery]

  let wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={true}>
        <UserEditPanel id={'fakeId3'} />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  const panel = wrapper.find('UserEditPanel')
  expect(panel).toMatchSnapshot()
})

test('User should be able to select and add roles', async () => {
  const mocks = [userRoleListDocumentQuery]

  const wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserEditPanel />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  wrapper.find('Select button').simulate('click')
  wrapper.find('li[role="option"]').last().simulate('click')
  wrapper.find('button > Icon > MaterialIconAdd').simulate('click')

  const panel = wrapper.find('UserEditPanel')
  expect(panel).toMatchSnapshot()
})

test('User should be able to remove user role', async () => {
  const mocks = [userDocumentQuery, userRoleListDocumentQuery]

  let wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={true}>
        <UserEditPanel id={'fakeId3'} />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  wrapper.find('ForwardRef(IconButton)').first().simulate('click')
  wrapper.find('ForwardRef(MenuButton)').simulate('click')

  const panel = wrapper.find('UserEditPanel')
  expect(panel).toMatchSnapshot()
})

test('User should be able to create a new user', async () => {
  const user = {
    name: 'Testing Müller',
    email: 'testing@mueller.com',
    roleIDs: [],
    password: 'superSecret'
  }

  const mocks = [
    {
      request: {
        query: CreateUserDocument,
        variables: {
          input: {
            name: user.name,
            email: user.email,
            roleIDs: user.roleIDs
          },
          password: user.password
        }
      },
      result: () => ({
        data: {
          user: {
            __typename: 'User',
            id: 'fakeId4',
            name: user.name,
            email: user.email,
            roles: user.roleIDs
          }
        }
      })
    },
    userRoleListDocumentQuery
  ]

  let wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserEditPanel />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  act(() => {
    wrapper
      .find('input[placeholder="userList.panels.name"]')
      .simulate('change', {target: {value: user.name}})
    wrapper
      .find('input[placeholder="userList.panels.email"]')
      .simulate('change', {target: {value: user.email}})
    wrapper
      .find('input[placeholder="userList.panels.password"]')
      .simulate('change', {target: {value: user.password}})
  })

  await act(async () => {
    wrapper.find('button > Icon > MaterialIconSaveOutlined').simulate('click')
  })

  const panel = wrapper.find('UserEditPanel')
  expect(panel).toMatchSnapshot()
})
