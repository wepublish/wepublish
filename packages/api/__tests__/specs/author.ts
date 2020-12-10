import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {CreateAuthor, AuthorInput, AuthorList} from '../api/private'

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
    let authorId = ''
    beforeEach(async () => {
      const {mutate} = testClientPrivate
      const authorInput: AuthorInput = {
        name: 'JRR Tolkien',
        slug: 'j-tolkien',
        bio: []
      }
      const res = await mutate({
        mutation: CreateAuthor,
        variables: {
          input: authorInput
        }
      })
      authorId = res.data?.createAuthor?.id
      console.log(authorId)
    })

    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const authorInput: AuthorInput = {
        name: 'John Grisham',
        slug: 'j-grish',
        bio: []
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
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: AuthorList,
        variables: {
          first: 5
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          authors: {
            nodes: expect.any(Array),
            pageInfo: {
              endCursor: expect.any(String),
              startCursor: expect.any(String)
            }
            //totalCount will return size of list which changes depending on how many tests were run
            //expect any number?
          }
        }
      })
    })
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
