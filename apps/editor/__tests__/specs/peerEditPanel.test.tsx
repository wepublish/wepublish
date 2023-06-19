import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {fireEvent, render} from '@testing-library/react'
import {CreatePeerDocument, PeerDocument} from '@wepublish/editor/api'
import {AuthContext} from '@wepublish/ui/editor'
import React from 'react'
import snapshotDiff from 'snapshot-diff'

import {PeerEditPanel} from '../../src/app/panel/peerEditPanel'
import {actWait, sessionWithPermissions} from '../utils'

const MockedProvider = MockedProviderBase as any

describe('Peer Edit Panel', () => {
  test('should render', async () => {
    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider addTypename={false}>
          <PeerEditPanel hostURL={'localhost:4000'} />
        </MockedProvider>
      </AuthContext.Provider>
    )

    expect(asFragment()).toMatchSnapshot()
  })

  test('should render with ID', async () => {
    const mocks = [
      {
        request: {
          query: PeerDocument,
          variables: {
            id: 'peerId1'
          }
        },
        result: () => {
          return {
            data: {
              peer: {
                __typename: 'Peer',
                id: 'peerId1',
                name: 'Test Peer Name',
                slug: 'test-peer-name',
                isDisabled: false,
                hostURL: 'https://test-url.ch/',
                profile: {}
              }
            }
          }
        }
      }
    ]
    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <PeerEditPanel id={'peerId1'} hostURL={'localhost:4000'} />
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
  })

  test('should be able to generate a new peering', async () => {
    const peer = {
      id: 'roleId1',
      name: 'something peer name',
      slug: 'something-peer-name',
      hostURL: 'https://host-url.ch/',
      token: 'abc123def456',
      profile: {}
    }
    const mocks = [
      {
        request: {
          query: CreatePeerDocument,
          variables: {
            input: {
              name: peer.name,
              slug: peer.slug,
              hostURL: peer.hostURL,
              token: peer.token
            }
          }
        },
        result: () => {
          return {
            data: {
              createPeer: {
                __typename: 'Peer',
                id: peer.id,
                name: peer.name,
                slug: peer.slug,
                hostURL: peer.hostURL,
                profile: peer.profile
              }
            }
          }
        }
      }
    ]

    const {asFragment, getByLabelText, getByTestId} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <PeerEditPanel hostURL={'localhost:4000'} />
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()
    const initialRender = asFragment()

    const nameInput = getByLabelText('peerList.panels.name*')
    const urlInput = getByLabelText('peerList.panels.URL*')
    const tokenInput = getByLabelText('peerList.panels.token*')
    const saveButton = getByTestId('saveButton')

    fireEvent.change(nameInput, {
      target: {value: peer.name}
    })

    fireEvent.change(urlInput, {
      target: {value: peer.hostURL}
    })

    fireEvent.change(tokenInput, {
      target: {value: peer.token}
    })

    fireEvent.click(saveButton)

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
          <PeerEditPanel hostURL={'localhost:4000'} />
        </MockedProvider>
      </AuthContext.Provider>
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
