// import {CommentInput, AddComment} from '../api/public'
// import {CommentAuthorType, CommentItemType} from '../../lib'

// let testServerPrivate: ApolloServer

beforeAll(async () => {
  try {
    // const setupClient = await createGraphQLTestClientWithPrisma()
    // testServerPrivate = setupClient.testServerPrivate
  } catch (error) {
    console.log('Error', error)

    throw new Error('Error during test setup')
  }
})

describe('Comments', () => {
  test('can be created', async () => {
    // const {mutate} = testServerPublic
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
