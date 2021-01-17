import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
// import {CommentInput, AddPublicComment} from '../api/public'
// import {CommentAuthorType, CommentItemType} from '../../lib'

let testClientPublic: ApolloServerTestClient
// let testClientPrivate: ApolloServerTestClient
let dbAdapter: MongoDBAdapter

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithMongoDB()
    testClientPublic = setupClient.testClientPublic
    // testClientPrivate = setupClient.testClientPrivate
    dbAdapter = setupClient.dbAdapter

    console.log('public', testClientPublic)
  } catch (error) {
    console.log('Error', error)

    throw new Error('Error during test setup')
  }
})

describe('Comments', () => {
  test('can be created', async () => {
    // const {mutate} = testClientPublic
    // const CommentInput: CommentInput = {
    //   itemID: 'd',
    //   itemType: CommentItemType.Article,
    //   userID: 'ID!',
    //   text: [
    //     {
    //       type: 'paragraph',
    //       children: [{text: 'hello'}]
    //     }
    //   ]
    // }
    // const res = await mutate({
    //   mutation: AddPublicComment,
    //   variables: {
    //     input: CommentInput
    //   }
    // })
    // expect(res).toMatchSnapshot()
    // expect(res?.data?.AddPublicComment?.authorType).toContain(CommentAuthorType.Author)
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
