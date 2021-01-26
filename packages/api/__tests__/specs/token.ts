import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {CreateToken, TokenList, DeleteToken} from '../api/private'

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

describe('Tokens', () => {
  describe('can be created/updated/edited/deleted:', () => {
    const ids: string[] = []
    beforeEach(async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: CreateToken,
        variables: {
          input: {
            name: `Test Token Name ${ids.length}`
          }
        }
      })
      ids.unshift(res.data?.createToken?.id)
    })

    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: CreateToken,
        variables: {
          input: {
            name: 'New Create Token'
          }
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          createToken: {
            id: expect.any(String),
            token: expect.any(String)
          }
        }
      })
      ids.unshift(res.data?.createToken?.id)
      expect(res.data?.createToken.token).toBeDefined()
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const res = await query({query: TokenList})
      expect(res).toMatchSnapshot({
        data: {
          tokens: Array.from({length: ids.length}, () => ({
            id: expect.any(String)
          }))
        }
      })
      expect(res.data?.tokens?.length).toBe(ids.length)
    })

    test('can be deleted', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: DeleteToken,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          deleteToken: expect.any(String)
        }
      })
      expect(res.data?.deleteToken).toBe(ids[0])
      ids.shift()
    })
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
