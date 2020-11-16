import React from 'react'
import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {TokenGeneratePanel} from '../../src/client/panel/tokenGeneratePanel'
import {mount} from 'enzyme'

import {updateWrapper} from '../utils'
import {act} from 'react-dom/test-utils'
import {CreateTokenDocument} from '../../src/client/api'

const MockedProvider = MockedProviderBase as any

describe('Token Generate Panel', () => {
  test('should render', async () => {
    const wrapper = mount(
      <MockedProvider addTypename={false}>
        <TokenGeneratePanel />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    const panel = wrapper.find('TokenGeneratePanel')
    expect(panel).toMatchSnapshot()
  })

  test('should be able to generate a new token', async () => {
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
      <MockedProvider mocks={mocks} addTypename={false}>
        <TokenGeneratePanel />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    wrapper
      .find('input[placeholder="tokenList.panels.name"]')
      .simulate('change', {target: {value: tokenName}})

    await act(async () => {
      wrapper.find('button[className="rs-btn rs-btn-primary"]').simulate('click')
    })
    await updateWrapper(wrapper, 100)

    const panel = wrapper.find('TokenGeneratePanel')
    expect(panel).toMatchSnapshot()
  })
})
