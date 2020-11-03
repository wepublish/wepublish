import React from 'react'
import {MockedProvider} from '@apollo/client/testing'
import {TokenGeneratePanel} from '../../src/client/panel/tokenGeneratePanel'
import Enzyme, {mount} from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

import {UIProvider} from '@karma.run/ui'
import * as fela from 'fela'
import {updateWrapper} from '../utils'
import {act} from 'react-dom/test-utils'
import {CreateTokenDocument} from '../../src/client/api'

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

test('Generate Token Panel should render', async () => {
  const wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider addTypename={false}>
        <TokenGeneratePanel />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  const panel = wrapper.find('TokenGeneratePanel')
  expect(panel).toMatchSnapshot()
})

test('User should be able to generate new token', async () => {
  const tokenName = 'New Test Token Name'
  const mocks = [
    {
      request: {
        query: CreateTokenDocument,
        variables: {
          input: {
            name: tokenName
          }
        }
      },
      result: () => {
        return {
          data: {
            createToken: {
              __typename: 'CreatedToken',
              id: 'testId123',
              name: tokenName,
              token: 'iXBGZLn7L5bAg455FQiCrd7RUQJtgWZ5'
            }
          }
        }
      }
    }
  ]

  const wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <TokenGeneratePanel />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  wrapper
    .find('input[placeholder="tokenList.panels.name"]')
    .simulate('change', {target: {value: tokenName}})

  await act(async () => {
    wrapper.find('button > Icon > MaterialIconSaveOutlined').simulate('click')
  })
  await updateWrapper(wrapper, 100)

  const panel = wrapper.find('TokenGeneratePanel')
  expect(panel).toMatchSnapshot()
})
