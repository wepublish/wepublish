import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {
  ArticleInput,
  CreateArticle,
  ArticleList,
  Article,
  UpdateArticle,
  DeleteArticle,
  PublishArticle,
  UnpublishArticle
} from '../api/private'
import {Article as PublicArticle, ArticleList as ArticleListPublic} from '../api/public'

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
  describe('can be created/edited/deleted:', () => {
    const articleIds: string[] = []
    beforeEach(async () => {
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
        socialMediaTitle: 'A social media title',
        socialMediaAuthorIDs: [],
        socialMediaDescription: 'A social media description',
        socialMediaImageID: '',
        blocks: []
      }
      const res = await mutate({
        mutation: CreateArticle,
        variables: {
          input: articleInput
        }
      })
      articleIds.unshift(res.data?.createArticle?.id)
    })

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
        socialMediaTitle: 'A social media title',
        socialMediaAuthorIDs: [],
        socialMediaDescription: 'A social media description',
        socialMediaImageID: '',
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
      articleIds.unshift(res.data?.createArticle?.id)
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const articles = await query({
        query: ArticleList,
        variables: {
          first: 100
        }
      })
      expect(articles).toMatchSnapshot({
        data: {
          articles: {
            nodes: Array.from({length: articleIds.length}, () => ({
              createdAt: expect.any(String),
              id: expect.any(String),
              modifiedAt: expect.any(String)
            })),
            pageInfo: {
              endCursor: expect.any(String),
              startCursor: expect.any(String)
            },
            totalCount: expect.any(Number)
          }
        }
      })
      expect(articles.data?.articles?.totalCount).toBe(articleIds.length)
    })

    test('can be read by id', async () => {
      const {query} = testClientPrivate
      const article = await query({
        query: Article,
        variables: {
          id: articleIds[0]
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

    test('can be read by id - published', async () => {
      //publish article
      const {mutate} = testClientPrivate
      await mutate({
        mutation: PublishArticle,
        variables: {
          id: articleIds[0],
          publishAt: '2020-11-25T23:55:35.000Z',
          publishedAt: '2020-11-25T23:55:35.000Z',
          updatedAt: '2020-11-25T23:55:35.000Z'
        }
      })
      //read published
      const {query} = testClientPublic
      const article = await query({
        query: PublicArticle,
        variables: {
          id: articleIds[0]
        }
      })

      expect(article).toMatchSnapshot({
        data: {
          article: {
            id: expect.any(String),
            url: expect.any(String)
          }
        }
      })
      expect(article.data?.article.id).toBe(articleIds[0])
      expect(article.data?.article.url).toContain(articleIds[0])
    })

    test('can be read in list - published', async () => {
      const {query} = testClientPublic
      const articles = await query({
        query: ArticleListPublic,
        variables: {
          first: 100
        }
      })
      expect(articles).toMatchSnapshot({
        data: {
          articles: {
            nodes: [
              {
                id: expect.any(String)
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

    test('can be updated', async () => {
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
            socialMediaTitle: 'A new social media title',
            socialMediaAuthorIDs: [],
            socialMediaDescription: 'A new social media description',
            socialMediaImageID: '',
            blocks: []
          },
          id: articleIds[0]
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

    test('can be published', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: PublishArticle,
        variables: {
          id: articleIds[0],
          publishAt: '2020-11-25T23:55:35.000Z',
          publishedAt: '2020-11-25T23:55:35.000Z',
          updatedAt: '2020-11-25T23:55:35.000Z'
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          publishArticle: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can be unpublished', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: UnpublishArticle,
        variables: {
          id: articleIds[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          unpublishArticle: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can be deleted', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: DeleteArticle,
        variables: {
          id: articleIds[0]
        }
      })
      expect(res).toMatchSnapshot()
      articleIds.shift()
    })
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
