import {ApolloServerTestClient} from 'apollo-server-testing'
import {
  Author,
  AuthorInput,
  AuthorList,
  CreateAuthor,
  DeleteAuthor,
  UpdateAuthor
} from '../api/private'

import {createGraphQLTestClientWithMongoDB} from '../utility'

let testClientPrivate: ApolloServerTestClient

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithMongoDB()
    testClientPrivate = setupClient.testClientPrivate
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Authors', () => {
  describe('can be created/edited/deleted:', () => {
    const authorIds: string[] = []
    beforeEach(async () => {
      const {mutate} = testClientPrivate
      const authorInput: AuthorInput = {
        name: 'JRR Tolkien',
        slug: `tolkien-${authorIds.length}`,
        links: [
          {title: 'link 1', url: 'www.link1.ch'},
          {title: 'link 2', url: 'www.link2.ch'}
        ],
        bio: [
          {
            type: 'heading-one',
            children: [
              {
                text: 'Test Bio'
              }
            ]
          },
          {
            type: 'paragraph',
            children: [
              {
                text: 'bio text 😀'
              }
            ]
          }
        ]
      }
      const res = await mutate({
        mutation: CreateAuthor,
        variables: {
          input: authorInput
        }
      })
      authorIds.unshift(res.data?.createAuthor?.id)
    })

    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const authorInput: AuthorInput = {
        name: 'John Grisham',
        slug: 'john-grisham',
        links: [
          {title: 'link 1', url: 'www.link1.ch'},
          {title: 'link 2', url: 'www.link2.ch'}
        ],
        bio: [
          {
            type: 'heading-one',
            children: [
              {
                text: 'Author Bio Heading'
              }
            ]
          },
          {
            type: 'paragraph',
            children: [
              {
                text: 'author bio text'
              }
            ]
          }
        ]
      }
      const res = await mutate({
        mutation: CreateAuthor,
        variables: {
          input: authorInput
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          createAuthor: {
            id: expect.any(String)
          }
        }
      })
      authorIds.unshift(res.data?.createAuthor?.id)
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: AuthorList,
        variables: {
          take: 100
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          authors: {
            nodes: Array.from({length: authorIds.length}, () => ({
              id: expect.any(String)
            })),
            pageInfo: {
              endCursor: expect.any(String),
              startCursor: expect.any(String)
            },
            totalCount: expect.any(Number)
          }
        }
      })
      expect(res.data?.authors?.totalCount).toBe(authorIds.length)
    })

    test('can be read by id', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: Author,
        variables: {
          id: authorIds[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          author: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can be updated', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: UpdateAuthor,
        variables: {
          input: {
            name: 'Jane Austen',
            slug: 'j-austen',
            links: [{title: 'homepage', url: 'www.j-a.com'}]
          },
          id: authorIds[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          updateAuthor: {
            id: expect.any(String)
          }
        }
      })
    })

    test('can be deleted', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: DeleteAuthor,
        variables: {
          id: authorIds[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          deleteAuthor: expect.any(String)
        }
      })
      authorIds.shift()
    })
  })
})
