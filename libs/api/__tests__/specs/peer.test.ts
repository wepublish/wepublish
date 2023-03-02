import {ApolloServer} from 'apollo-server-express'
import {FetchMock} from 'jest-fetch-mock'
import fetch from 'node-fetch'
import {
  CreatePeer,
  CreatePeerInput,
  DeletePeer,
  Peer,
  PeerList,
  PeerProfile,
  PeerProfileInput,
  UpdatePeer,
  UpdatePeerProfile
} from '../api/private'
import fakePeerAdminSchema from '../fakePeerAdminSchema.json'

import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'
;(fetch as unknown as FetchMock).mockResponse(JSON.stringify(fakePeerAdminSchema))

let testServerPrivate: ApolloServer

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testServerPrivate = setupClient.testServerPrivate
  } catch (error) {
    console.log('Error', error)

    throw new Error('Error during test setup')
  }
})

describe('Peers', () => {
  describe('can be created/edited/deleted:', () => {
    const ids: string[] = []
    beforeAll(async () => {
      const input: CreatePeerInput = {
        name: `Peer Test ${ids.length}`,
        slug: generateRandomString(),
        hostURL: 'https://host-url.ch/',
        token: `token${ids.length}`
      }
      const res = await testServerPrivate.executeOperation({
        query: CreatePeer,
        variables: {
          input
        }
      })
      ids.unshift(res.data?.createPeer?.id)
    })

    test('can be created', async () => {
      const input: CreatePeerInput = {
        name: 'Create Peer Test',
        slug: generateRandomString(),
        hostURL: 'https://host-url.ch/',
        token: 'testTokenABC123'
      }
      const res = await testServerPrivate.executeOperation({
        query: CreatePeer,
        variables: {
          input
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          createPeer: {
            id: expect.any(String),
            slug: expect.any(String)
          }
        }
      })
      ids.unshift(res.data?.createPeer?.id)
    })

    test('can be read in list', async () => {
      const res = await testServerPrivate.executeOperation({
        query: PeerList
      })

      expect(res.data?.peers).not.toHaveLength(0)
    })

    test('can be read by id', async () => {
      const res = await testServerPrivate.executeOperation({
        query: Peer,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          peer: {
            id: expect.any(String),
            slug: expect.any(String)
          }
        }
      })
    })

    test('can be updated', async () => {
      const res = await testServerPrivate.executeOperation({
        query: UpdatePeer,
        variables: {
          input: {
            name: 'Updated Peer',
            slug: generateRandomString(),
            hostURL: 'https://new-host-url.ch/',
            token: 'newTestTokenABC123'
          },
          id: ids[0]
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          updatePeer: {
            id: expect.any(String),
            slug: expect.any(String)
          }
        }
      })
    })

    test('can be deleted', async () => {
      const res = await testServerPrivate.executeOperation({
        query: DeletePeer,
        variables: {
          id: ids[0]
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          deletePeer: expect.any(Object)
        }
      })
      expect(res.data?.deletePeer.id).toBe(ids[0])

      ids.shift()
    })

    test('can read peer profile', async () => {
      const res = await testServerPrivate.executeOperation({
        query: PeerProfile
      })
      expect(res).toMatchSnapshot()
    })

    test('can update peer profile', async () => {
      const input: PeerProfileInput = {
        name: 'test peer profile',
        themeColor: '#4287f5',
        themeFontColor: '#d67c15',
        callToActionText: [{text: 'rich text call to action'}],
        callToActionURL: 'calltoactionurl.ch/'
      }

      const res = await testServerPrivate.executeOperation({
        query: UpdatePeerProfile,
        variables: {
          input
        }
      })

      expect(res).toMatchSnapshot()
    })
  })
})
