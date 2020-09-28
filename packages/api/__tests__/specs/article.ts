import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {ArticleInput, CreateArticle} from '../api/private'

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

describe('Articles', () => {
  describe('can be created/edited/deleted', () => {
    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const articleInput: ArticleInput = {
        title: 'This is the best test article',
        slug: 'my-super-seo-slug-for-the-best-article',
        shared: false,
        tags: ['testing', 'awesome'],
        breaking: true,
        lead: 'This article will rock your world. Never has there been a better article',
        preTitle: 'Testing GraphQL',
        properties: [
          {key: 'testingKey', value: 'testingValue', public: true},
          {key: 'privateTestingKey', value: 'privateTestingValue', public: false}
        ],
        authorIDs: [],
        blocks: []
      }
      const res = await mutate({
        mutation: CreateArticle,
        variables: {
          input: articleInput
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          createArticle: {
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
