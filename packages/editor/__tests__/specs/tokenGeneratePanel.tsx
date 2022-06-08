import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {fireEvent, render} from '@testing-library/react'
import React from 'react'
import snapshotDiff from 'snapshot-diff'
import {CreateTokenDocument} from '../../src/client/api'
import {TokenGeneratePanel} from '../../src/client/panel/tokenGeneratePanel'
import {actWait} from '../utils'

const MockedProvider = MockedProviderBase as any

describe('Token Generate Panel', () => {
  test('should render', async () => {
    const {asFragment} = render(
      <MockedProvider addTypename={false}>
        <TokenGeneratePanel />
      </MockedProvider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
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

    const {asFragment, container} = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <TokenGeneratePanel />
      </MockedProvider>
    )
    await actWait()
    const initialRender = asFragment()

    fireEvent.change(container.querySelector('input[placeholder="tokenList.panels.name"]')!, {
      target: {value: tokenName}
    })
    fireEvent.click(container.querySelector('button.rs-btn.rs-btn-primary')!)
    await actWait()

    expect(snapshotDiff(initialRender, asFragment())).toMatchSnapshot()
  })
})
