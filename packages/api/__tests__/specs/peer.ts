import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {
  CreatePeerInput,
  CreatePeer,
  PeerList,
  Peer,
  PeerProfile,
  UpdatePeer,
  DeletePeer,
  UpdatePeerProfile
} from '../api/private'
import {Peer as PublicPeer} from '../api/public'
import {FetchMock} from 'jest-fetch-mock'
import fetch from 'node-fetch'
import fakePeerAdminSchema from '../fakePeerAdminSchema.json'
import {PeerProfileInput} from '../../lib'

// Mocking Fetch calls from the "createFetcher" method in context
;((fetch as unknown) as FetchMock).mockResponse(JSON.stringify(fakePeerAdminSchema))

let testClientPublic: ApolloServerTestClient
let testClientPrivate: ApolloServerTestClient
let dbAdapter: MongoDBAdapter

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithMongoDB()
    testClientPublic = setupClient.testClientPublic
    testClientPrivate = setupClient.testClientPrivate
    dbAdapter = setupClient.dbAdapter

    console.log('public', testClientPublic)
  } catch (error) {
    console.log('Error', error)

    throw new Error('Error during test setup')
  }
})

describe('Peers', () => {
  describe('can be created/edited/deleted:', () => {
    const ids: string[] = []
    beforeEach(async () => {
      const {mutate} = testClientPrivate
      const input: CreatePeerInput = {
        name: `Peer Test ${ids.length}`,
        slug: `test-peer${ids.length}`,
        hostURL: 'https://host-url.ch/',
        token: `token${ids.length}`
      }
      const res = await mutate({
        mutation: CreatePeer,
        variables: {
          input: input
        }
      })
      ids.unshift(res.data?.createPeer?.id)
    })

    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const input: CreatePeerInput = {
        name: 'Create Peer Test',
        slug: 'test-peer',
        hostURL: 'https://host-url.ch/',
        token: 'testTokenABC123'
      }
      const res = await mutate({
        mutation: CreatePeer,
        variables: {
          input: input
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          createPeer: {
            id: expect.any(String)
          }
        }
      })
      ids.unshift(res.data?.createPeer?.id)
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: PeerList
      })
      expect(res).toMatchSnapshot({
        data: {
          peers: Array.from({length: ids.length}, () => ({
            id: expect.any(String)
          }))
        }
      })
      expect(res.data?.peers?.length).toBe(ids.length)
    })

    test('can be read by id', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: Peer,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          peer: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can be read by id - public', async () => {
      const {query} = testClientPublic
      const res = await query({
        query: PublicPeer,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          peer: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can be updated', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: UpdatePeer,
        variables: {
          input: {
            name: 'Updated Peer',
            slug: 'update-peer',
            hostURL: 'https://new-host-url.ch/',
            token: 'newTestTokenABC123'
          },
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          updatePeer: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can be deleted', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: DeletePeer,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          deletePeer: expect.any(String)
        }
      })
      ids.shift()
    })

    test('can read peer profile', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: PeerProfile
      })
      expect(res).toMatchSnapshot()
    })

    test('can update peer profile', async () => {
      const {mutate} = testClientPrivate
      const input: PeerProfileInput = {
        name: 'test peer profile',
        logoID: 'logoID123',
        themeColor: '#4287f5',
        callToActionText: [{text: 'rich text call to action'}],
        callToActionURL: 'calltoactionurl.ch/'
      }
      const res = await mutate({
        mutation: UpdatePeerProfile,
        variables: {
          input: input
        }
      })
      expect(res).toMatchSnapshot()
    })
  })

  test('rejects invalid color', async () => {
    const {mutate} = testClientPrivate

    const input: PeerProfileInput = {
      name: 'test peer profile',
      logoID: 'logoID123',
      themeColor: 'invalidHEXstring',
      callToActionText: [{text: 'rich text call to action'}],
      callToActionURL: 'calltoactionurl.ch/'
    }
    const res = await mutate({
      mutation: UpdatePeerProfile,
      variables: {
        input: input
      }
    })

    expect(res).toMatchSnapshot()
    expect(res?.data).toBeUndefined()
    expect(res?.errors?.[0].message).toBe(
      'Variable "$input" got invalid value "invalidHEXstring" at "input.themeColor"; Expected type Color. Invalid hex color string.'
    )
  })

  test('rejects non string input for color', async () => {
    const {mutate} = testClientPrivate

    const res = await mutate({
      mutation: UpdatePeerProfile,
      variables: {
        input: {
          name: 'test peer profile',
          logoID: 'logoID123',
          themeColor: 100,
          callToActionText: [{text: 'rich text call to action'}],
          callToActionURL: 'calltoactionurl.ch/'
        }
      }
    })

    expect(res).toMatchSnapshot()
    expect(res?.data).toBeUndefined()
    expect(res?.errors?.[0].message).toBe(
      'Variable "$input" got invalid value 100 at "input.themeColor"; Expected type Color. '
    )
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
