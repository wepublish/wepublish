import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {CommentInput, CommentStatus, CreateComment} from '../api/private'
import {CommentAuthorType} from '../../lib'

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

describe('Comments', () => {
  test('can be created', async () => {
    const {mutate} = testClientPrivate
    const CommentInput: CommentInput = {
      itemId: 'd',
      userID: 'ID!',
      revisions: [
        {
          text: [
            {
              type: 'paragraph',
              children: [{text: 'hello'}]
            }
          ]
        }
      ],
      status: CommentStatus.Approved,
      authorType: CommentAuthorType.Admin
    }
    const res = await mutate({
      mutation: CreateComment,
      variables: {
        input: CommentInput
      }
    })

    expect(res).toMatchSnapshot()
    expect(res?.data?.createComment?.authorType).toContain('Admin')
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
