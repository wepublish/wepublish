import {ApolloServer} from 'apollo-server-express'

import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'
import {CreateArticle, PublishArticle, CreatePage, PublishPage} from '../api/private/index'
import {Phrase} from '../api/public/index'

let testServerPrivate: ApolloServer
let testServerPublic: ApolloServer

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testServerPrivate = setupClient.testServerPrivate
    testServerPublic = setupClient.testServerPublic
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Phrases', () => {
  test.each([
    {
      titleQuery: 'fox & dog',
      bodyQuery: 'bunny & hedgehog',
      match: true
    },
    {
      titleQuery: 'dog & fox',
      bodyQuery: 'hedgehog & bunny',
      match: true
    },
    {
      titleQuery: 'dog & cat',
      bodyQuery: 'hedgehog & capibara',
      match: false
    },
    {
      titleQuery: '!cat',
      bodyQuery: '!capibara',
      match: true
    },
    {
      titleQuery: 'fox | cat',
      bodyQuery: 'bunny | capibara',
      match: true
    },
    {
      titleQuery: 'pig | cat',
      bodyQuery: 'kiwi | capibara',
      match: false
    },
    {
      titleQuery: 'fox <-> jumps',
      bodyQuery: 'bunny <-> jumps',
      match: true
    },
    {
      titleQuery: 'jumps <-> fox',
      bodyQuery: 'jumps <-> bunny',
      match: false
    },
    {
      name: "If ! is used the code word can't be present in either body or title",
      query: '!bunny',
      match: false
    }
  ])('should query articles for %p', async ({query, titleQuery, bodyQuery, match}) => {
    const articleRes = await testServerPrivate.executeOperation({
      query: CreateArticle,
      variables: {
        input: {
          slug: generateRandomString(),
          title: 'The quick brown bunny jumps over the lazy hedgehog',
          lead: '',
          seoTitle: '',
          authorIDs: [],
          breaking: false,
          shared: false,
          tags: [],
          canonicalUrl: '',
          properties: [],
          blocks: [
            {
              richText: {
                richText: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        text: 'The quick brown fox jumps over the lazy dog'
                      }
                    ]
                  }
                ]
              }
            }
          ],
          hideAuthor: false,
          socialMediaAuthorIDs: []
        }
      }
    })

    await testServerPrivate.executeOperation({
      query: PublishArticle,
      variables: {
        id: articleRes.data.createArticle.id,
        publishAt: '2022-12-30T11:16:19.554Z',
        publishedAt: '2022-12-30T11:16:19.554Z',
        updatedAt: '2022-12-30T11:16:19.554Z'
      }
    })

    const [bodyRes, titleRes] = await Promise.all([
      testServerPublic.executeOperation({
        query: Phrase,
        variables: {
          query: bodyQuery || query
        }
      }),
      testServerPublic.executeOperation({
        query: Phrase,
        variables: {
          query: titleQuery || query
        }
      })
    ])

    if (match) {
      expect(bodyRes.data.phrase.articles.length).toBeTruthy()
      expect(titleRes.data.phrase.articles.length).toBeTruthy()
    } else {
      expect(bodyRes.data.phrase.articles.length).toBeFalsy()
      expect(titleRes.data.phrase.articles.length).toBeFalsy()
    }
  })

  test.each([
    {
      titleQuery: 'fox & dog',
      bodyQuery: 'bunny & hedgehog',
      match: true
    },
    {
      titleQuery: 'dog & fox',
      bodyQuery: 'hedgehog & bunny',
      match: true
    },
    {
      titleQuery: 'dog & cat',
      bodyQuery: 'hedgehog & capibara',
      match: false
    },
    {
      titleQuery: '!cat',
      bodyQuery: '!capibara',
      match: true
    },
    {
      titleQuery: 'fox | cat',
      bodyQuery: 'bunny | capibara',
      match: true
    },
    {
      titleQuery: 'pig | cat',
      bodyQuery: 'kiwi | capibara',
      match: false
    },
    {
      titleQuery: 'fox <-> jumps',
      bodyQuery: 'bunny <-> jumps',
      match: true
    },
    {
      titleQuery: 'jumps <-> fox',
      bodyQuery: 'jumps <-> bunny',
      match: false
    },
    {
      name: "If ! is used the code word can't be present in either body or title",
      query: '!bunny',
      match: false
    }
  ])('should query pages for %p', async ({query, titleQuery, bodyQuery, match}) => {
    const pageRes = await testServerPrivate.executeOperation({
      query: CreatePage,
      variables: {
        input: {
          slug: generateRandomString(),
          title: 'The quick brown bunny jumps over the lazy hedgehog',
          description: '',
          tags: [],
          properties: [],
          blocks: [
            {
              richText: {
                richText: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        text: 'The quick brown fox jumps over the lazy dog'
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      }
    })

    await testServerPrivate.executeOperation({
      query: PublishPage,
      variables: {
        id: pageRes.data.createPage.id,
        publishAt: '2022-12-30T11:16:19.554Z',
        publishedAt: '2022-12-30T11:16:19.554Z',
        updatedAt: '2022-12-30T11:16:19.554Z'
      }
    })

    const [bodyRes, titleRes] = await Promise.all([
      testServerPublic.executeOperation({
        query: Phrase,
        variables: {
          query: bodyQuery || query
        }
      }),
      testServerPublic.executeOperation({
        query: Phrase,
        variables: {
          query: titleQuery || query
        }
      })
    ])

    if (match) {
      expect(bodyRes.data.phrase.pages.length).toBeTruthy()
      expect(titleRes.data.phrase.pages.length).toBeTruthy()
    } else {
      expect(bodyRes.data.phrase.pages.length).toBeFalsy()
      expect(titleRes.data.phrase.pages.length).toBeFalsy()
    }
  })
})
