import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {
  CreateAuthor,
  AuthorInput,
  AuthorList,
  Author,
  UpdateAuthor,
  DeleteAuthor
} from '../api/private'
import {Author as PublicAuthor} from '../api/public'

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

describe('Authors', () => {
  describe('can be created/edited/deleted:', () => {
    let authorIds: string[] = []
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
          first: 100,
          sort: 'MODIFIED_AT',
          order: 'DESCENDING'
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
      expect(res.data?.author.id).toBe(authorIds[0])
    })

    test('can be read by slug', async () => {
      const {query} = testClientPublic
      const res = await query({
        query: PublicAuthor,
        variables: {
          slug: 'john-grisham'
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          author: {
            id: expect.any(String)
          }
        }
      })
      expect(res.data?.author.slug).toBe('john-grisham')
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

    test('should require either slug or ID to read', async () => {
      const {query} = testClientPublic
      //none
      let res = await query({query: PublicAuthor})
      expect(res).toMatchSnapshot()
      //both
      res = await query({
        query: PublicAuthor,
        variables: {
          id: authorIds[0],
          slug: 'john-grisham'
        }
      })
      expect(res).toMatchSnapshot()
    })

    test('will reject invalid slug', async () => {
      const {mutate} = testClientPrivate
      let res = await mutate({
        mutation: CreateAuthor,
        variables: {
          input: {
            name: 'John Grisham',
            slug: 123,
            links: [],
            bio: []
          }
        }
      })
      expect(res).toMatchSnapshot()
      expect(res.data).toBeUndefined()
      expect(res?.errors?.[0].message).toBe(
        'Variable "$input" got invalid value 123 at "input.slug"; Expected type Slug. '
      )

      res = await mutate({
        mutation: CreateAuthor,
        variables: {
          input: {
            name: 'John Grisham',
            links: [],
            bio: []
          }
        }
      })
      expect(res?.errors?.[0].message).toBe(
        'Variable "$input" got invalid value { name: "John Grisham", links: [], bio: [] }; Field slug of required type Slug! was not provided.'
      )
    })
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
