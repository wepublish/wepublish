import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {createGraphQLTestClientWithMongoDB} from '../utility'
// import {CommentInput, AddComment} from '../api/public'
// import {CommentAuthorType, CommentItemType} from '../../lib'

// let testClientPrivate: ApolloServerTestClient

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithMongoDB()
    // testClientPrivate = setupClient.testClientPrivate
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
    //   text: [
    //     {
    //       type: 'paragraph',
    //       children: [{text: 'hello'}]
    //     }
    //   ]
    // }
    // const res = await mutate({
    //   mutation: AddComment,
    //   variables: {
    //     input: CommentInput
    //   }
    // })
    // expect(res).toMatchSnapshot()
    // expect(res?.data?.AddComment?.authorType).toContain(CommentAuthorType.Author)
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
