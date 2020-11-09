import React from 'react'
import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {PeerEditPanel} from '../../src/client/panel/peerEditPanel'
import {mount} from 'enzyme'

import {UIProvider} from '@karma.run/ui'
import * as fela from 'fela'
import {updateWrapper} from '../utils'
import {act} from 'react-dom/test-utils'
import {PeerDocument, CreatePeerDocument} from '../../src/client/api'

const MockedProvider = MockedProviderBase as any

const styleRenderer: fela.IRenderer = {
  renderRule: jest.fn(),
  renderKeyframe: jest.fn(),
  renderFont: jest.fn(),
  renderStatic: jest.fn(),
  renderToString: jest.fn(),
  subscribe: jest.fn(),
  clear: jest.fn()
}

describe('Peer Edit Panel', () => {
  test('should render', async () => {
    const wrapper = mount(
      <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
        <MockedProvider addTypename={false}>
          <PeerEditPanel />
        </MockedProvider>
      </UIProvider>
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
                hostURL: 'https://test-url.ch/'
              }
            }
          }
        }
      }
    ]
    const wrapper = mount(
      <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <PeerEditPanel id={'peerId1'} />
        </MockedProvider>
      </UIProvider>
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
      <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <PeerEditPanel />
        </MockedProvider>
      </UIProvider>
    )
    await updateWrapper(wrapper, 100)

    act(() => {
      wrapper
        .find('input[placeholder="peerList.panels.name"]')
        .simulate('change', {target: {value: peer.name}})

      wrapper
        .find('input[placeholder="peerList.panels.URL"]')
        .simulate('change', {target: {value: peer.hostURL}})

      wrapper
        .find('input[placeholder="peerList.panels.token"]')
        .simulate('change', {target: {value: peer.token}})
    })
    await act(async () => {
      wrapper.find('button > Icon > MaterialIconSaveOutlined').simulate('click')
    })
    await updateWrapper(wrapper, 100)

    const panel = wrapper.find('PeerEditPanel')
    expect(panel).toMatchSnapshot()
  })
})
