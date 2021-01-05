import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {CommentInput, CreateComment} from '../api/private'
import {CommentAuthorType, CommentStatus} from '../../lib'

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
  describe('can be created:', () => {
    const CommentIds: string[] = []
    beforeEach(async () => {
      const {mutate} = testClientPrivate
      const CommentInput: CommentInput = {
        siteID: '',
        userID: 'ID!',
        permalink: 'String!',
        articleID: 'ID',
        imageID: 'ID',
        peerID: 'ID',
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
        parentID: 'ID',
        status: CommentStatus.Approved,
        authorType: CommentAuthorType.Admin
      }
      const res = await mutate({
        mutation: CreateComment,
        variables: {
          input: CommentInput
        }
      })
      CommentIds.unshift(res.data?.createComment?.id)
    })

    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const CommentInput: CommentInput = {
        siteID: '',
        userID: 'ID!',
        permalink: 'String!',
        articleID: 'ID',
        imageID: 'ID',
        peerID: 'ID',
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
        parentID: 'ID',
        status: CommentStatus.Approved,
        authorType: CommentAuthorType.Admin
      }
      const res = await mutate({
        mutation: CreateComment,
        variables: {
          input: CommentInput
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          createComment: {
            id: expect.any(String)
          }
        }
      })
      CommentIds.unshift(res.data?.createComment?.id)
    })
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
