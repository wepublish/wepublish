import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {CreatePeerInput, CreatePeer, PeerList, Peer} from '../api/private'

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
      console.log('total count: ' + res.data?.articles?.totalCount)
      console.log('array length: ' + ids.length)
      expect(res.data?.articles?.totalCount).toBe(ids.length)
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
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
