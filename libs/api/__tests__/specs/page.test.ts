import {ApolloServer} from 'apollo-server-express'
import {
  CreatePage,
  DeletePage,
  Page,
  PageInput,
  PageList,
  PublishPage,
  UnpublishPage,
  UpdatePage
} from '../api/private'

import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'

let testServerPrivate: ApolloServer

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
    const setupClient = await createGraphQLTestClientWithPrisma()
    testServerPrivate = setupClient.testServerPrivate
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Pages', () => {
  describe('can be created/edited/published/unpublished/deleted:', () => {
    const ids: string[] = []
    beforeAll(async () => {
      const input: PageInput = {
        title: 'Testing Page',
        slug: generateRandomString(),
        tags: ['one', 'two', 'three'],
        properties: [
          {key: 'private', value: 'private', public: false},
          {key: 'public', value: 'public', public: true}
        ],
        blocks: []
      }

      const res = await testServerPrivate.executeOperation({
        query: CreatePage,
        variables: {
          input
        }
      })

      ids.unshift(res.data?.createPage.id)
    })

    test('can be created', async () => {
      const input: PageInput = {
        title: 'Testing Page',
        slug: generateRandomString(),
        tags: ['one', 'two', 'three'],
        properties: [
          {key: 'private', value: 'private', public: false},
          {key: 'public', value: 'public', public: true}
        ],
        blocks
      }

      const res = await testServerPrivate.executeOperation({
        query: CreatePage,
        variables: {
          input
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          createPage: {
            id: expect.any(String),
            latest: expect.objectContaining({
              slug: expect.any(String)
            })
          }
        }
      })

      ids.unshift(res.data?.createPage.id)
    })

    test('can be read in list', async () => {
      const res = await testServerPrivate.executeOperation({
        query: PageList,
        variables: {
          take: 100
        }
      })

      expect(res.data?.pages.nodes).not.toHaveLength(0)
    })

    test('can be read by id', async () => {
      const res = await testServerPrivate.executeOperation({
        query: Page,
        variables: {
          id: ids[0]
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          page: {
            id: expect.any(String),
            latest: expect.objectContaining({
              slug: expect.any(String)
            })
          }
        }
      })
    })

    test('can be updated', async () => {
      const res = await testServerPrivate.executeOperation({
        query: UpdatePage,
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
            id: expect.any(String),
            latest: expect.objectContaining({
              slug: expect.any(String)
            })
          }
        }
      })
    })

    test('can be published', async () => {
      const res = await testServerPrivate.executeOperation({
        query: PublishPage,
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
            id: expect.any(String),
            latest: expect.objectContaining({
              slug: expect.any(String)
            })
          }
        }
      })
    })

    test('can not be published with the same slug', async () => {
      const input: PageInput = {
        title: 'Testing Page with the same slug',
        slug: 'testing-page',
        tags: [],
        properties: [],
        blocks: []
      }

      const newPage = await testServerPrivate.executeOperation({
        query: CreatePage,
        variables: {
          input
        }
      })

      await testServerPrivate.executeOperation({
        query: PublishPage,
        variables: {
          id: newPage.data?.createPage.id,
          publishAt: '2020-11-25T23:55:35.000Z',
          publishedAt: '2020-11-25T23:55:35.000Z',
          updatedAt: '2020-11-25T23:55:35.000Z'
        }
      })

      const newPage2 = await testServerPrivate.executeOperation({
        query: CreatePage,
        variables: {
          input
        }
      })

      const res = await testServerPrivate.executeOperation({
        query: PublishPage,
        variables: {
          id: newPage2.data?.createPage.id,
          publishAt: '2020-11-25T23:55:35.000Z',
          publishedAt: '2020-11-25T23:55:35.000Z',
          updatedAt: '2020-11-25T23:55:35.000Z'
        }
      })

      expect(res).toMatchSnapshot({
        errors: expect.any(Array)
      })
    })

    test('can be unpublished', async () => {
      const res = await testServerPrivate.executeOperation({
        query: UnpublishPage,
        variables: {
          id: ids[0]
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          unpublishPage: {
            id: expect.any(String),
            latest: expect.objectContaining({
              slug: expect.any(String)
            })
          }
        }
      })
    })

    test('can be deleted', async () => {
      const res = await testServerPrivate.executeOperation({
        query: DeletePage,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          deletePage: expect.any(Object)
        }
      })
      expect(res.data?.deletePage.id).toBe(ids[0])
      ids.shift()
    })
  })
})
