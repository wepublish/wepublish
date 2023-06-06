import {CommentItemType, CreateComment} from '../api/private'

import {createGraphQLTestClientWithPrisma} from '../utility'
import {ApolloServer} from 'apollo-server-express'
import {PrismaClient} from '@prisma/client'

let testClientPrivate: ApolloServer
let testClientPublic: ApolloServer
let prisma: PrismaClient

let testServerPrivate: ApolloServer

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testClientPrivate = setupClient.testServerPrivate
    testClientPublic = setupClient.testServerPublic
    prisma = setupClient.prisma
  } catch (error) {
    console.log('Error', error)

    throw new Error('Error during test setup')
  }
})

describe('Comments', () => {
  describe('create', () => {
    test('can be created', async () => {
      const res = await testClientPrivate.executeOperation({
        query: CreateComment,
        variables: {
          itemID: 'd',
          itemType: CommentItemType.Article,
          text: [
            {
              type: 'paragraph',
              children: [{text: 'hello'}]
            }
          ]
        }
      })
      console.log(res)
      expect(res).toMatchSnapshot({
        data: {
          createComment: {
            id: expect.any(String)
          }
        }
      })
      // expect(res?.data?.AddComment?.authorType).toContain(CommentAuthorType.Author)
    })
  })
})
