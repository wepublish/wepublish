import {ApolloServerTestClient} from 'apollo-server-testing'
import {FetchMock} from 'jest-fetch-mock'
import fetch from 'node-fetch'
import {
  CreateNewsroom,
  CreateNewsroomInput,
  DeleteNewsroom,
  Newsroom,
  NewsroomList,
  PeerProfile,
  UpdateNewsroom,
  UpdateOwnNewsroom,
  UpdateOwnNewsroomInput
} from '../api/private'
import fakePeerAdminSchema from '../fakePeerAdminSchema.json'

import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'
;((fetch as unknown) as FetchMock).mockResponse(JSON.stringify(fakePeerAdminSchema))

let testClientPrivate: ApolloServerTestClient

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testClientPrivate = setupClient.testClientPrivate
  } catch (error) {
    console.log('Error', error)

    throw new Error('Error during test setup')
  }
})

describe('Peers', () => {
  describe('can be created/edited/deleted:', () => {
    const ids: string[] = []
    beforeAll(async () => {
      const {mutate} = testClientPrivate
      const input: CreateNewsroomInput = {
        name: `Peer Test ${ids.length}`,
        slug: generateRandomString(),
        hostURL: 'https://host-url.ch/',
        token: `token${ids.length}`
      }
      const res = await mutate({
        mutation: CreateNewsroom,
        variables: {
          input: input
        }
      })
      ids.unshift(res.data.createPeer?.id)
    })

    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const input: CreateNewsroomInput = {
        name: 'Create Peer Test',
        slug: generateRandomString(),
        hostURL: 'https://host-url.ch/',
        token: 'testTokenABC123'
      }
      const res = await mutate({
        mutation: CreateNewsroom,
        variables: {
          input: input
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          createNewsroom: {
            id: expect.any(String),
            slug: expect.any(String)
          }
        }
      })
      ids.unshift(res.data.createNewsroom?.id)
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: NewsroomList
      })

      expect(res.data.newsrooms).not.toHaveLength(0)
    })

    test('can be read by id', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: Newsroom,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          newsroom: {
            id: expect.any(String),
            slug: expect.any(String)
          }
        }
      })
    })

    test('can be updated', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: UpdateNewsroom,
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
          updateNewsroom: {
            id: expect.any(String),
            slug: expect.any(String)
          }
        }
      })
    })

    test('can be deleted', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: DeleteNewsroom,
        variables: {
          id: ids[0]
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          deleteNewsroom: expect.any(Object)
        }
      })
      expect(res.data.deleteNewsroom.id).toBe(ids[0])

      ids.shift()
    })

    test('can read peer profile', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: PeerProfile
      })
      expect(res).toMatchSnapshot({
        data: {
          peerProfile: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can update peer profile', async () => {
      const {mutate} = testClientPrivate
      const input: UpdateOwnNewsroomInput = {
        name: 'test peer profile',
        logoID: 'logoID123',
        themeColor: '#4287f5',
        themeFontColor: '#d67c15',
        callToActionText: [{text: 'rich text call to action'}],
        callToActionURL: 'calltoactionurl.ch/'
      }

      const res = await mutate({
        mutation: UpdateOwnNewsroom,
        variables: {
          input: input
        }
      })

      expect(res).toMatchSnapshot()
    })
  })
})
