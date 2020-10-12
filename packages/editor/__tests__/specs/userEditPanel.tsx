import React from 'react'
import {MockedProvider} from '@apollo/client/testing'
import {UserEditPanel} from '../../src/client/panel/userEditPanel'
import {UserDocument, UserRoleListDocument} from '../../src/client/api'
import Enzyme, {mount} from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

// React 16 Enzyme adapter
Enzyme.configure({adapter: new Adapter()})

import {UIProvider} from '@karma.run/ui'
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

test('User Edit Panel should render', () => {
  const mocks = [
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
/*
test('Clicking add block button should display two text fields ', () => {
  const wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider addTypename={false}>
        <UserEditPanel />
      </MockedProvider>
    </UIProvider>
  )
  const button = wrapper.find(ListInput).find('button')
  button.simulate('click')
  expect(wrapper).toMatchSnapshot()

  const inputField = wrapper.find(TextInput).at(1).find('input')
  console.log(inputField.props())
  inputField.props().value = 'abcd'

  console.log(inputField.debug())
  expect(inputField).toMatchSnapshot()
})
*/
