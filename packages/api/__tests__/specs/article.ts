import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import gql from 'graphql-tag'
import {createGraphQLTestClientWithMongoDB} from '../utility'

let testClient: ApolloServerTestClient
let dbAdapter: MongoDBAdapter

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithMongoDB()
    testClient = setupClient.testClient
    dbAdapter = setupClient.dbAdapter
  } catch (error) {
    throw new Error('Error during test setup')
  }
})

describe('Articles', () => {
  const GET_ARTICLES = gql`
    {
      articles(first: 5) {
        nodes {
          id
          title
          lead
        }
      }
    }
  `

  test('can execute query', async done => {
    const {query} = testClient
    const res = await query({
      query: GET_ARTICLES,
      variables: {
        first: 5
      }
    })

    expect(res).toMatchSnapshot()
    done()
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
