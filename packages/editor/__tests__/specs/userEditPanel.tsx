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

test('User Edit Panel should render', () => {
  const mocks = [userRoleListDocumentQuery]
  const wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserEditPanel />
      </MockedProvider>
    </UIProvider>
  )
  expect(wrapper).toMatchSnapshot()
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

  expect(wrapper).toMatchSnapshot()
})

test('User should be able to select and add roles', async () => {
  const mocks = [userRoleListDocumentQuery]

  let wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserEditPanel />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  wrapper.find('Select[description="Select User Role"] button').simulate('click')
  wrapper.find('li[role="option"]').last().simulate('click')

  wrapper.find('button > Icon > MaterialIconAdd').simulate('click')
  expect(wrapper).toMatchSnapshot()
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

  expect(wrapper).toMatchSnapshot()
})

test('User should be able to create a new user', async () => {
  const mocks = [
    {
      request: {
        query: CreateUserDocument,
        variables: {
          input: {
            name: 'Testing Müller',
            email: 'testing@mueller.com',
            roleIDs: []
          },
          password: 'superSecret'
        }
      },
      result: () => ({
        data: {
          user: {
            __typename: 'User',
            id: 'fakeId4',
            name: 'Testing Müller',
            email: 'testing@mueller.com',
            roles: []
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
      .find('input[placeholder="Name"]')
      .simulate('change', {target: {value: 'Testing Müller'}})
    wrapper
      .find('input[placeholder="Email"]')
      .simulate('change', {target: {value: 'testing@mueller.com'}})
    wrapper
      .find('input[placeholder="Password"]')
      .simulate('change', {target: {value: 'superSecret'}})
  })

  act(() => {
    wrapper.find('button > Icon > MaterialIconSaveOutlined').simulate('click')
  })

  expect(wrapper).toMatchSnapshot()
})
