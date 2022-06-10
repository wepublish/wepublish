import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {fireEvent, render} from '@testing-library/react'
import React from 'react'
import {CreatePeerDocument, PeerDocument} from '../../src/client/api'
import {PeerEditPanel} from '../../src/client/panel/peerEditPanel'
import {actWait} from '../utils'
import snapshotDiff from 'snapshot-diff'

const MockedProvider = MockedProviderBase as any

describe('Peer Edit Panel', () => {
  test('should render', async () => {
    const {asFragment} = render(
      <MockedProvider addTypename={false}>
        <PeerEditPanel hostURL={'localhost:4000'} />
      </MockedProvider>
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
      <MockedProvider mocks={mocks} addTypename={false}>
        <PeerEditPanel id={'peerId1'} hostURL={'localhost:4000'} />
      </MockedProvider>
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
      <MockedProvider mocks={mocks} addTypename={false}>
        <PeerEditPanel hostURL={'localhost:4000'} />
      </MockedProvider>
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
})
