import {ApolloServer} from 'apollo-server-express'

import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'
import {CreateArticle, PublishArticle, CreatePage, PublishPage} from '../api/private/index'
import {Phrase} from '../api/public/index'
import {PrismaClient} from '@prisma/client'

let testServerPrivate: ApolloServer
let testServerPublic: ApolloServer
let prisma: PrismaClient

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testServerPrivate = setupClient.testServerPrivate
    testServerPublic = setupClient.testServerPublic
    prisma = setupClient.prisma
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Phrases', () => {
  test.each([
    {
      titleQuery: 'fox dog',
      bodyQuery: 'bunny hedgehog',
      match: true
    },
    {
      titleQuery: 'dog&fox',
      bodyQuery: 'hedgehog&bunny',
      match: true
    },
    {
      titleQuery: 'dog&cat',
      bodyQuery: 'hedgehog&capibara',
      match: false
    },
    {
      titleQuery: '!cat',
      bodyQuery: '!capibara',
      match: true
    },
    {
      titleQuery: 'fox|cat',
      bodyQuery: 'bunny|capibara',
      match: true
    },
    {
      titleQuery: 'pig|cat',
      bodyQuery: 'kiwi|capibara',
      match: false
    },
    {
      titleQuery: 'fox<->jumps',
      bodyQuery: 'bunny<->jumps',
      match: true
    },
    {
      titleQuery: 'jumps<->fox',
      bodyQuery: 'jumps<->bunny',
      match: false
    },
    {
      titleQuery: 'quick fox lazy hedgehog',
      bodyQuery: 'quick fox lazy hedgehog',
      match: true
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
          lead: 'The quick brown fox jumps over the lazy dog',
          seoTitle: '',
          authorIDs: [],
          breaking: false,
          shared: false,
          hidden: false,
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

    const result = [
      ...bodyRes.data.phrase.articles.nodes,
      ...titleRes.data.phrase.articles.nodes
    ].filter(article => article.id === articleRes.data.createArticle.id)

    if (match) {
      expect(result.length).toBeTruthy()
    } else {
      expect(result.length).toBeFalsy()
    }
  })

  test.each([
    {
      titleQuery: 'fox dog',
      bodyQuery: 'bunny hedgehog',
      match: true
    },
    {
      titleQuery: 'dog&fox',
      bodyQuery: 'hedgehog&bunny',
      match: true
    },
    {
      titleQuery: 'dog&cat',
      bodyQuery: 'hedgehog&capibara',
      match: false
    },
    {
      titleQuery: '!cat',
      bodyQuery: '!capibara',
      match: true
    },
    {
      titleQuery: 'fox|cat',
      bodyQuery: 'bunny|capibara',
      match: true
    },
    {
      titleQuery: 'pig|cat',
      bodyQuery: 'kiwi|capibara',
      match: false
    },
    {
      titleQuery: 'fox<->jumps',
      bodyQuery: 'bunny<->jumps',
      match: true
    },
    {
      titleQuery: 'jumps<->fox',
      bodyQuery: 'jumps<->bunny',
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

    const result = [...bodyRes.data.phrase.pages.nodes, ...titleRes.data.phrase.pages.nodes].filter(
      page => page.id === pageRes.data.createPage.id
    )

    if (match) {
      expect(result.length).toBeTruthy()
    } else {
      expect(result.length).toBeFalsy()
    }
  })

  describe('reports pageInfo and totalCount', () => {
    beforeEach(async () => {
      await prisma.article.deleteMany({})

      for (let i = 0; i < 10; i++) {
        const res = await testServerPrivate.executeOperation({
          query: CreateArticle,
          variables: {
            input: {
              slug: generateRandomString(),
              title: 'The quick brown bunny jumps over the lazy hedgehog',
              lead: 'The quick brown fox jumps over the lazy dog',
              seoTitle: '',
              authorIDs: [],
              breaking: false,
              shared: false,
              hidden: false,
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
            id: res.data.createArticle.id,
            publishAt: '2022-12-30T11:16:19.554Z',
            publishedAt: '2022-12-30T11:16:19.554Z',
            updatedAt: '2022-12-30T11:16:19.554Z'
          }
        })
      }
    })

    test('honors take parameter', async () => {
      const res = await testServerPublic.executeOperation({
        query: Phrase,
        variables: {
          query: 'fox',
          skip: 0,
          take: 5
        }
      })

      const articles = res.data!.phrase.articles
      expect(articles.totalCount).toEqual(10)
      expect(articles.nodes.length).toEqual(5)
      expect(articles.pageInfo.hasPreviousPage).toEqual(false)
      expect(articles.pageInfo.hasNextPage).toEqual(true)
    })

    test('honors skip parameter', async () => {
      const res = await testServerPublic.executeOperation({
        query: Phrase,
        variables: {
          query: 'fox',
          skip: 8,
          take: 5
        }
      })

      const articles = res.data!.phrase.articles
      expect(articles.totalCount).toEqual(10)
      expect(articles.nodes.length).toEqual(2)
      expect(articles.pageInfo.hasPreviousPage).toEqual(true)
      expect(articles.pageInfo.hasNextPage).toEqual(false)
    })

    test('returns empty at end of result set', async () => {
      const res = await testServerPublic.executeOperation({
        query: Phrase,
        variables: {
          query: 'fox',
          skip: 10,
          take: 5
        }
      })

      const articles = res.data!.phrase.articles
      expect(articles.totalCount).toEqual(10)
      expect(articles.nodes.length).toEqual(0)
      expect(articles.pageInfo.hasPreviousPage).toEqual(true)
      expect(articles.pageInfo.hasNextPage).toEqual(false)
    })
  })
})
