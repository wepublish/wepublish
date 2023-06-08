import {CommentItemType, CreateComment} from '../api/private'

import {createGraphQLTestClientWithPrisma} from '../utility'
import {ApolloServer} from 'apollo-server-express'
import {PrismaClient} from '@prisma/client'
import {AddComment, CommentItemType as PublicCommentItemType} from '../api/public'
// import  * as hasPermissionModule from '@wepublish/permissions/api'
// eslint-disable-next-line @nx/enforce-module-boundaries
import * as hasPermissionModule from '../.../../../../../libs/permissions/api/src/lib/has-permission'
// '@wepublish/permissions/api'

let testClientPrivate: ApolloServer
let testClientPublic: ApolloServer
let prisma: PrismaClient

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

afterEach(async () => {
  jest.clearAllMocks()
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
      expect(res).toMatchSnapshot({
        data: {
          createComment: {
            id: expect.any(String)
          }
        }
      })
      // expect(res?.data?.AddComment?.authorType).toContain(CommentAuthorType.Author)
    })

    test('comment from a user with approval permission is approved', async () => {
      const spy = jest
        .spyOn(hasPermissionModule, 'hasPermission')
        // authorise()
        .mockImplementationOnce(() => {
          const originalResult = jest.requireActual('@wepublish/api').hasPermission
          return originalResult
        })
        // canSkipApproval
        .mockImplementationOnce(() => true)

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
      expect(spy).toHaveBeenCalled()
      expect(res.data.createComment.state).toBe('Approved')
    })

    test('comment from a user without approval permission is pending approval', async () => {
      const spy = jest
        .spyOn(hasPermissionModule, 'hasPermission')
        // authorise()
        .mockImplementationOnce(() => {
          const originalResult = jest.requireActual('@wepublish/api').hasPermission
          return originalResult
        })
        // canSkipApproval
        .mockImplementationOnce(() => false)

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
      expect(spy).toHaveBeenCalled()
      expect(res.data.createComment.state).toBe('PendingApproval')
    })

    test('Public: comment from a user with approval permission is approved', async () => {
      const spy = jest
        .spyOn(hasPermissionModule, 'hasPermission')
        // canSkipApproval
        .mockImplementationOnce(() => true)

      const res = await testClientPublic.executeOperation({
        query: AddComment,
        variables: {
          input: {
            itemID: 'd',
            itemType: PublicCommentItemType.Article,
            text: [
              {
                type: 'paragraph',
                children: [{text: 'hello'}]
              }
            ]
          }
        }
      })

      expect(spy).toHaveBeenCalled()
      expect(res.data.addComment.state).toBe('Approved')
    })
    test('Public: comment from a user without approval permission is pending approval', async () => {
      const spy = jest
        .spyOn(hasPermissionModule, 'hasPermission')
        // canSkipApproval
        .mockImplementationOnce(() => false)

      const res = await testClientPublic.executeOperation({
        query: AddComment,
        variables: {
          input: {
            itemID: 'd',
            itemType: PublicCommentItemType.Article,
            text: [
              {
                type: 'paragraph',
                children: [{text: 'hello'}]
              }
            ]
          }
        }
      })

      expect(spy).toHaveBeenCalled()
      expect(res.data.addComment.state).toBe('PendingApproval')
    })
  })
})
