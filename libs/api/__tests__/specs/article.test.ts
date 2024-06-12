import {ApolloServer} from 'apollo-server-express'
import {
  Article,
  ArticleInput,
  ArticleList,
  AuthorInput,
  CreateArticle,
  CreateAuthor,
  CreateTag,
  DeleteArticle,
  PublishArticle,
  TagType,
  UnpublishArticle,
  UpdateArticle
} from '../api/private'

import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'

let testServerPrivate: ApolloServer

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testServerPrivate = setupClient.testServerPrivate
  } catch (error) {
    console.log('Error', error)

    throw new Error('Error during test setup')
  }
})

describe('Articles', () => {
  describe('can be created/edited/deleted:', () => {
    const articleIds: string[] = []
    const tagIds = [] as string[]

    beforeAll(async () => {
      const [tag1, tag2, tag3] = await Promise.all([
        testServerPrivate.executeOperation({
          query: CreateTag,
          variables: {
            tag: 'Tag 1',
            type: TagType.Article
          }
        }),
        testServerPrivate.executeOperation({
          query: CreateTag,
          variables: {
            tag: 'Tag 2',
            type: TagType.Article
          }
        }),
        testServerPrivate.executeOperation({
          query: CreateTag,
          variables: {
            tag: 'Tag 3',
            type: TagType.Article
          }
        })
      ])

      tagIds.push(tag1.data?.createTag.id)
      tagIds.push(tag2.data?.createTag.id)
      tagIds.push(tag3.data?.createTag.id)

      const articleInput: ArticleInput = {
        title: 'This is the best test article',
        slug: generateRandomString(),
        shared: false,
        hidden: false,
        tags: [tagIds[0], tagIds[1]],
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

      const res = await testServerPrivate.executeOperation({
        query: CreateArticle,
        variables: {
          input: articleInput
        }
      })

      articleIds.unshift(res.data?.createArticle.id)
    })

    test('can be created', async () => {
      const articleInput: ArticleInput = {
        title: 'This is the best test article',
        slug: generateRandomString(),
        shared: false,
        hidden: false,
        tags: [tagIds[0], tagIds[1]],
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
      const res = await testServerPrivate.executeOperation({
        query: CreateArticle,
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
            }),
            tags: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 1'
              }),
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 2'
              })
            ])
          }
        }
      })

      articleIds.unshift(res.data?.createArticle.id)
    })

    test('can be read in list', async () => {
      const res = await testServerPrivate.executeOperation({
        query: ArticleList,
        variables: {
          take: 100
        }
      })

      expect(res.data?.articles.nodes).not.toHaveLength(0)
    })

    test('can be read by id', async () => {
      const article = await testServerPrivate.executeOperation({
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
            }),
            tags: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 1'
              }),
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 2'
              })
            ])
          }
        }
      })
    })

    test('can be updated', async () => {
      const updatedArticle = await testServerPrivate.executeOperation({
        query: UpdateArticle,
        variables: {
          input: {
            title: 'New Updated Title',
            slug: generateRandomString(),
            shared: false,
            hidden: false,
            tags: [tagIds[0], tagIds[1], tagIds[2]],
            breaking: true,
            lead: 'This updated article will rock your world. Never has there been a better article',
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
            }),
            tags: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 1'
              }),
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 2'
              }),
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 3'
              })
            ])
          }
        }
      })
    })

    test('can be published', async () => {
      const res = await testServerPrivate.executeOperation({
        query: PublishArticle,
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
            }),
            tags: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 1'
              }),
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 2'
              })
            ])
          }
        }
      })
    })

    test('can be published twice with authorIds', async () => {
      const authorRes = await testServerPrivate.executeOperation({
        query: CreateAuthor,
        variables: {
          input: {
            name: 'Foobar',
            slug: generateRandomString(),
            links: [],
            bio: []
          } as AuthorInput
        }
      })

      const articleInput = {
        title: '',
        slug: generateRandomString(),
        shared: false,
        hidden: false,
        tags: [],
        breaking: true,
        lead: '',
        preTitle: '',
        hideAuthor: false,
        properties: [],
        authorIDs: [authorRes.data.createAuthor.id],
        socialMediaTitle: 'A social media title',
        socialMediaDescription: 'A social media description',
        socialMediaImageID: null,
        blocks: [],
        socialMediaAuthorIDs: [authorRes.data.createAuthor.id]
      } as ArticleInput

      const createdArticle = await testServerPrivate.executeOperation({
        query: CreateArticle,
        variables: {
          input: articleInput
        }
      })

      const firstPublish = await testServerPrivate.executeOperation({
        query: PublishArticle,
        variables: {
          id: createdArticle.data.createArticle.id,
          publishAt: '2020-11-25T23:55:35.000Z',
          publishedAt: '2020-11-25T23:55:35.000Z',
          updatedAt: '2020-11-25T23:55:35.000Z'
        }
      })

      const update = await testServerPrivate.executeOperation({
        query: UpdateArticle,
        variables: {
          input: {
            ...articleInput,
            title: 'Second Update'
          } as ArticleInput,
          id: createdArticle.data.createArticle.id
        }
      })

      const secondPublish = await testServerPrivate.executeOperation({
        query: PublishArticle,
        variables: {
          id: createdArticle.data.createArticle.id,
          publishAt: '2020-12-25T23:55:35.000Z',
          publishedAt: '2020-12-25T23:55:35.000Z',
          updatedAt: '2020-12-25T23:55:35.000Z'
        }
      })

      expect(secondPublish).toMatchSnapshot({
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

    test('can be published in the future', async () => {
      const articleInput = {
        title: '',
        slug: generateRandomString(),
        shared: false,
        hidden: false,
        tags: [tagIds[0], tagIds[1]],
        breaking: true,
        lead: '',
        preTitle: '',
        hideAuthor: false,
        properties: [],
        authorIDs: [],
        socialMediaTitle: 'A social media title',
        socialMediaDescription: 'A social media description',
        socialMediaImageID: null,
        blocks: [],
        socialMediaAuthorIDs: []
      } as ArticleInput

      const createdArticle = await testServerPrivate.executeOperation({
        query: CreateArticle,
        variables: {
          input: articleInput
        }
      })

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const res = await testServerPrivate.executeOperation({
        query: PublishArticle,
        variables: {
          id: createdArticle.data.createArticle.id,
          publishAt: tomorrow.toISOString(),
          publishedAt: tomorrow.toISOString(),
          updatedAt: '2020-11-25T23:55:35.000Z'
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          publishArticle: {
            id: expect.any(String),
            latest: expect.objectContaining({
              slug: expect.any(String)
            }),
            pending: {
              publishAt: expect.any(Date)
            },
            tags: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 1'
              }),
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 2'
              })
            ])
          }
        }
      })
    })

    test('can be published twice in the future with authorIds', async () => {
      const authorRes = await testServerPrivate.executeOperation({
        query: CreateAuthor,
        variables: {
          input: {
            name: 'Foobar',
            slug: generateRandomString(),
            links: [],
            bio: []
          } as AuthorInput
        }
      })

      const articleInput = {
        title: '',
        slug: generateRandomString(),
        shared: false,
        hidden: false,
        tags: [tagIds[0], tagIds[1]],
        breaking: true,
        lead: '',
        preTitle: '',
        hideAuthor: false,
        properties: [],
        authorIDs: [authorRes.data.createAuthor.id],
        socialMediaTitle: 'A social media title',
        socialMediaDescription: 'A social media description',
        socialMediaImageID: null,
        blocks: [],
        socialMediaAuthorIDs: [authorRes.data.createAuthor.id]
      } as ArticleInput

      const createdArticle = await testServerPrivate.executeOperation({
        query: CreateArticle,
        variables: {
          input: articleInput
        }
      })

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const firstPublish = await testServerPrivate.executeOperation({
        query: PublishArticle,
        variables: {
          id: createdArticle.data.createArticle.id,
          publishAt: tomorrow.toISOString(),
          publishedAt: tomorrow.toISOString(),
          updatedAt: '2020-11-25T23:55:35.000Z'
        }
      })

      const update = await testServerPrivate.executeOperation({
        query: UpdateArticle,
        variables: {
          input: {
            ...articleInput,
            title: 'Second Update'
          } as ArticleInput,
          id: createdArticle.data.createArticle.id
        }
      })

      const secondPublish = await testServerPrivate.executeOperation({
        query: PublishArticle,
        variables: {
          id: createdArticle.data.createArticle.id,
          publishAt: tomorrow.toISOString(),
          publishedAt: tomorrow.toISOString(),
          updatedAt: '2020-12-25T23:55:35.000Z'
        }
      })

      expect(secondPublish).toMatchSnapshot({
        data: {
          publishArticle: {
            id: expect.any(String),
            latest: expect.objectContaining({
              slug: expect.any(String)
            }),
            pending: {
              publishAt: expect.any(Date)
            },
            tags: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 1'
              }),
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 2'
              })
            ])
          }
        }
      })
    })

    test('can be unpublished', async () => {
      const res = await testServerPrivate.executeOperation({
        query: UnpublishArticle,
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
            }),
            tags: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 1'
              }),
              expect.objectContaining({
                id: expect.any(String),
                tag: 'Tag 2'
              })
            ])
          }
        }
      })
    })

    test('can be deleted', async () => {
      const res = await testServerPrivate.executeOperation({
        query: DeleteArticle,
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
