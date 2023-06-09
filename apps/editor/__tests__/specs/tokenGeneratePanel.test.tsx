import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {fireEvent, render} from '@testing-library/react'
import {CreateTokenDocument} from '@wepublish/editor/api'
import {AuthContext} from '@wepublish/ui/editor'
import React from 'react'
import snapshotDiff from 'snapshot-diff'

import {TokenGeneratePanel} from '../../src/app/panel/tokenGeneratePanel'
import {actWait, sessionWithPermissions} from '../utils'

const MockedProvider = MockedProviderBase as any

describe('Token Generate Panel', () => {
  test('should render', async () => {
    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider addTypename={false}>
          <TokenGeneratePanel />
        </MockedProvider>
      </AuthContext.Provider>
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
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <TokenGeneratePanel />
        </MockedProvider>
      </AuthContext.Provider>
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

  const sessionWithoutPermission = {
    session: {
      email: 'user@abc.ch',
      sessionToken: 'abcdefg',
      sessionRoles: [
        {
          id: 'user',
          description: 'User',
          name: 'user',
          systemRole: true,
          permissions: []
        }
      ]
    }
  }

  test('will not render without correct permission', () => {
    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithoutPermission}>
        <MockedProvider addTypename={false}>
          <TokenGeneratePanel />
        </MockedProvider>
      </AuthContext.Provider>
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
