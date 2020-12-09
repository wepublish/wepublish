import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {
  ArticleInput,
  CreateArticle,
  ArticleList,
  Article,
  UpdateArticle,
  DeleteArticle
} from '../api/private'

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
  let articleId = ''
  describe('can be created/edited/deleted:', () => {
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
        hideAuthor: false,
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
      articleId = res.data?.createArticle?.id
      expect(res).toMatchSnapshot({
        data: {
          createArticle: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can read list', async () => {
      const {query} = testClientPrivate
      const articles = await query({
        query: ArticleList,
        variables: {
          first: 1
        }
      })
      expect(articles).toMatchSnapshot({
        data: {
          articles: {
            nodes: [
              {
                createdAt: expect.any(String),
                id: expect.any(String),
                modifiedAt: expect.any(String)
              }
            ],
            pageInfo: {
              endCursor: expect.any(String),
              startCursor: expect.any(String)
            }
          }
        }
      })
    })

    test('can be read by id', async () => {
      const {query} = testClientPrivate
      const article = await query({
        query: Article,
        variables: {
          id: articleId
        }
      })
      expect(article).toMatchSnapshot({
        data: {
          article: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can update article', async () => {
      const {mutate} = testClientPrivate
      const updatedArticle = await mutate({
        mutation: UpdateArticle,
        variables: {
          input: {
            title: 'New Updated Title',
            slug: 'updated-slug',
            shared: false,
            tags: ['testing', 'awesome', 'another'],
            breaking: true,
            lead:
              'This updated article will rock your world. Never has there been a better article',
            preTitle: 'Testing GraphQL',
            hideAuthor: false,
            properties: [
              {key: 'testingKey', value: 'testingValue', public: true},
              {key: 'privateTestingKey', value: 'privateTestingValue', public: false}
            ],
            authorIDs: [],
            blocks: []
          },
          id: articleId
        }
      })
      expect(updatedArticle).toMatchSnapshot({
        data: {
          updateArticle: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can delete', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: DeleteArticle,
        variables: {
          id: articleId
        }
      })
      expect(res).toMatchSnapshot()
    })
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
