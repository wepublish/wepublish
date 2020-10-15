import React from 'react'
import {MockedProvider} from '@apollo/client/testing'
import {UserEditPanel} from '../../src/client/panel/userEditPanel'
import {UserDocument, UserRoleListDocument} from '../../src/client/api'
import Enzyme, {mount} from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

// React 16 Enzyme adapter
Enzyme.configure({adapter: new Adapter()})

import {UIProvider, IconButton, Select} from '@karma.run/ui'
import {act} from 'react-dom/test-utils'
import * as fela from 'fela'
import wait from 'waait'

const styleRenderer: fela.IRenderer = {
  renderRule: jest.fn(),
  renderKeyframe: jest.fn(),
  renderFont: jest.fn(),
  renderStatic: jest.fn(),
  renderToString: jest.fn(),
  subscribe: jest.fn(),
  clear: jest.fn()
}

const MOCKS = [
  {
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
]

test('User Edit Panel should render', () => {
  const wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={MOCKS} addTypename={false}>
        <UserEditPanel />
      </MockedProvider>
    </UIProvider>
  )
  expect(wrapper).toMatchSnapshot()
})

test('User Edit Panel should render with id', async () => {
  const mocks = [
    {
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
            roles: []
          }
        }
      })
    },
    {
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
              nodes: [],
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
  ]
  let wrapper

  await act(async () => {
    wrapper = mount(
      <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
        <MockedProvider mocks={mocks} addTypename={true}>
          <UserEditPanel id={'fakeId3'} />
        </MockedProvider>
      </UIProvider>
    )
    await wait(100)
    wrapper.update()
  })

  expect(wrapper).toMatchSnapshot()
})

test('User should be able to select and add roles', async () => {
  let wrapper

  await act(async () => {
    wrapper = mount(
      <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
        <MockedProvider mocks={MOCKS} addTypename={false}>
          <UserEditPanel />
        </MockedProvider>
      </UIProvider>
    )
    await wait(100)
    wrapper.update()
  })
  if (wrapper === null) {
    return
  }
  const rolesDropdown = wrapper.find(Select)
  rolesDropdown.find('button').simulate('click')
  rolesDropdown.props().onChange({value: 'roleId1'})

  // .simulate('keyDown', {key: 'ArrowDown', keyCode: 40})
  // .simulate('keyDown', {key: 'Enter', keyCode: 13})

  console.log(rolesDropdown.find('button').props())
  //console.log(rolesDropdown.props().options)

  const addButton = wrapper.find(IconButton).find('button')
  addButton.simulate('click')
  expect(wrapper).toMatchSnapshot()
})
