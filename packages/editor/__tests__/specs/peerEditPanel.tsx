import React from 'react'
import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {PeerEditPanel} from '../../src/client/panel/peerEditPanel'
import {mount} from 'enzyme'

import {updateWrapper} from '../utils'
import {act} from 'react-dom/test-utils'
import {PeerDocument, CreatePeerDocument} from '../../src/client/api'

const MockedProvider = MockedProviderBase as any

describe('Peer Edit Panel', () => {
  test('should render', async () => {
    const wrapper = mount(
      <MockedProvider addTypename={false}>
        <PeerEditPanel hostURL={'localhost:4000'} />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    const panel = wrapper.find('PeerEditPanel')
    expect(panel).toMatchSnapshot()
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
                hostURL: 'https://test-url.ch/',
                profile: {}
              }
            }
          }
        }
      }
    ]
    const wrapper = mount(
      <MockedProvider mocks={mocks} addTypename={false}>
        <PeerEditPanel id={'peerId1'} hostURL={'localhost:4000'} />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    const panel = wrapper.find('PeerEditPanel')
    expect(panel).toMatchSnapshot()
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

    const wrapper = mount(
      <MockedProvider mocks={mocks} addTypename={false}>
        <PeerEditPanel hostURL={'localhost:4000'} />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    act(() => {
      wrapper
        .find('input[name="peerList.panels.name"]')
        .simulate('change', {target: {value: peer.name}})

      wrapper
        .find('input[name="peerList.panels.URL"]')
        .simulate('change', {target: {value: peer.hostURL}})

      wrapper
        .find('input[name="peerList.panels.token"]')
        .simulate('change', {target: {value: peer.token}})
    })

    await act(async () => {
      wrapper
        .find('button[className="rs-btn rs-btn-primary fetchButton rs-btn-disabled"]')
        .simulate('click')
    })
    await updateWrapper(wrapper, 100)

    const panel = wrapper.find('PeerEditPanel')
    expect(panel).toMatchSnapshot()
  })
})
