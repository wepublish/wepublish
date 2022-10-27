import {ApolloServerTestClient} from 'apollo-server-testing'
import {
  Article,
  ArticleInput,
  ArticleList,
  CreateArticle,
  DeleteArticle,
  PublishArticle,
  UnpublishArticle,
  UpdateArticle
} from '../api/private'

import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'

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

describe('Articles', () => {
  describe('can be created/edited/deleted:', () => {
    const articleIds: string[] = []

    beforeAll(async () => {
      const {mutate} = testClientPrivate
      const articleInput: ArticleInput = {
        title: 'This is the best test article',
        slug: generateRandomString(),
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
        socialMediaImageID: null,
        blocks: []
      }
      const res = await mutate({
        mutation: CreateArticle,
        variables: {
          input: articleInput
        }
      })

      articleIds.unshift(res.data.createArticle.id)
    })

    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const articleInput: ArticleInput = {
        title: 'This is the best test article',
        slug: generateRandomString(),
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
        socialMediaImageID: null,
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
            id: expect.any(String),
            latest: expect.objectContaining({
              slug: expect.any(String)
            })
          }
        }
      })

      articleIds.unshift(res.data.createArticle.id)
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: ArticleList,
        variables: {
          take: 100
        }
      })

      expect(res.data.articles.nodes).not.toHaveLength(0)
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
            id: expect.any(String),
            latest: expect.objectContaining({
              slug: expect.any(String)
            })
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
            slug: generateRandomString(),
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
            socialMediaImageID: null,
            blocks: []
          },
          id: articleIds[0]
        }
      })

      expect(updatedArticle).toMatchSnapshot({
        data: {
          updateArticle: {
            id: expect.any(String),
            latest: expect.objectContaining({
              slug: expect.any(String)
            })
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
            id: expect.any(String),
            latest: expect.objectContaining({
              slug: expect.any(String)
            })
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
            id: expect.any(String),
            latest: expect.objectContaining({
              slug: expect.any(String)
            })
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

      expect(res).toMatchSnapshot({
        data: {
          deleteArticle: {
            id: expect.any(String),
            latest: expect.objectContaining({
              slug: expect.any(String)
            })
          }
        }
      })

      articleIds.shift()
    })
  })
})
