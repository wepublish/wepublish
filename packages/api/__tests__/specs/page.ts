import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {
  PageInput,
  CreatePage,
  PageList,
  Page,
  UpdatePage,
  PublishPage,
  UnpublishPage,
  DeletePage
} from '../api/private'

let testClientPublic: ApolloServerTestClient
let testClientPrivate: ApolloServerTestClient
let dbAdapter: MongoDBAdapter

const richTextNodes = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'p text rich text'
      }
    ]
  }
]

const titleBlock = {
  title: {
    title: 'title block title',
    lead: 'title lead'
  }
}
const listicleBlock = {
  listicle: {
    items: [
      {
        title: 'item title',
        richText: richTextNodes
      }
    ]
  }
}
const richTextBlock = {
  richText: {
    richText: richTextNodes
  }
}
const facebookPostBlock = {
  facebookPost: {
    userID: 'WePublish.Community',
    postID: '2191372684210495'
  }
}
const facebookVideoBlock = {
  facebookVideo: {
    userID: 'WePublish.Community',
    videoID: '2F1761095367238231'
  }
}
const instagramPostBlock = {
  instagramPost: {postID: 'B_AfAKgARJ4'}
}
const twitterTweetBlock = {
  twitterTweet: {
    userID: 'WePublish_media',
    tweetID: '1021701711172395008'
  }
}
const vimeoVideoBlock = {
  vimeoVideo: {
    videoID: '472380240'
  }
}
const youTubeVideoBlock = {
  youTubeVideo: {
    videoID: 'FjtGLMYgY5Y'
  }
}
const soundCloudTrackBlock = {
  soundCloudTrack: {
    trackID: '310511381'
  }
}
const embedBlock = {
  embed: {
    url: 'https://www.youtube.com/embed/cPAbx5kgCJo'
  }
}
const linkPageBreakBlock = {
  linkPageBreak: {
    richText: richTextNodes,
    hideButton: false
  }
}
const teaserGridBlock = {
  teaserGrid: {
    teasers: [],
    numColumns: 2
  }
}
const quoteBlock = {
  quote: {
    quote: 'quote text',
    author: 'author'
  }
}

const blocks = [
  titleBlock,
  listicleBlock,
  richTextBlock,
  facebookPostBlock,
  facebookVideoBlock,
  instagramPostBlock,
  twitterTweetBlock,
  vimeoVideoBlock,
  youTubeVideoBlock,
  soundCloudTrackBlock,
  embedBlock,
  linkPageBreakBlock,
  teaserGridBlock,
  quoteBlock
]

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

describe('Pages', () => {
  describe('can be created/edited/published/unpublished/deleted:', () => {
    const ids: string[] = []
    beforeEach(async () => {
      const {mutate} = testClientPrivate
      const input: PageInput = {
        title: 'Testing Page',
        slug: 'testing-page',
        tags: ['one', 'two', 'three'],
        properties: [
          {key: 'private', value: 'private', public: false},
          {key: 'public', value: 'public', public: true}
        ],
        blocks: []
      }
      const res = await mutate({
        mutation: CreatePage,
        variables: {
          input: input
        }
      })
      ids.unshift(res.data?.createPage?.id)
    })

    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const input: PageInput = {
        title: 'Testing Page',
        slug: 'testing-page',
        tags: ['one', 'two', 'three'],
        properties: [
          {key: 'private', value: 'private', public: false},
          {key: 'public', value: 'public', public: true}
        ],
        blocks: blocks
      }
      const res = await mutate({
        mutation: CreatePage,
        variables: {
          input: input
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          createPage: {
            id: expect.any(String)
          }
        }
      })
      ids.unshift(res.data?.createPage?.id)
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: PageList,
        variables: {
          first: 100
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          pages: {
            nodes: Array.from({length: ids.length}, () => ({
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
      expect(res.data?.pages?.totalCount).toBe(ids.length)
    })

    test('can be read by id', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: Page,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          page: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can be updated', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: UpdatePage,
        variables: {
          input: {
            title: 'Update Title',
            slug: 'update-slug',
            tags: ['update', 'tags'],
            properties: [
              {key: 'private', value: 'private', public: false},
              {key: 'public', value: 'public', public: true}
            ],
            blocks: [
              {
                title: {
                  title: 'new updated title',
                  lead: 'update lead'
                }
              }
            ]
          },
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          updatePage: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can be published', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: PublishPage,
        variables: {
          id: ids[0],
          publishAt: '2020-11-25T23:55:35.000Z',
          publishedAt: '2020-11-25T23:55:35.000Z',
          updatedAt: '2020-11-25T23:55:35.000Z'
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          publishPage: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can be unpublished', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: UnpublishPage,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          unpublishPage: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can be deleted', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: DeletePage,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot()
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
