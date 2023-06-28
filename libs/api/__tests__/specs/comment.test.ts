import {CommentItemType, CreateComment} from '../api/private'
import {createGraphQLTestClient, createGraphQLTestClientWithPrisma} from '../utility'
import {ApolloServer} from 'apollo-server-express'
import {PrismaClient} from '@prisma/client'
import {AddComment} from '../api/public'

let clientPrivateAsAdmin: ApolloServer
let clientPublicAsAdmin: ApolloServer
let clientPublicAsUser: ApolloServer
let clientPublicAsModerator: ApolloServer
let clientPrivateAsUser: ApolloServer
let clientPrivateAsModerator: ApolloServer
let prisma: PrismaClient

beforeAll(async () => {
  try {
    const clientAsAdmin = await createGraphQLTestClientWithPrisma()
    clientPrivateAsAdmin = clientAsAdmin.testServerPrivate
    clientPublicAsAdmin = clientAsAdmin.testServerPublic

    prisma = clientAsAdmin.prisma

    const needApprovalRole = await prisma.userRole.create({
      data: {
        name: 'needApprovalRole',
        systemRole: false,
        permissionIDs: ['CAN_GET_COMMENTS', 'CAN_UPDATE_COMMENTS']
      }
    })

    const authorizeCommentsRole = await prisma.userRole.create({
      data: {
        name: 'authorizeCommentsRole',
        systemRole: false,
        permissionIDs: ['CAN_CREATE_APPROVED_COMMENT']
      }
    })

    const user = await prisma.user.create({
      data: {
        id: 'unauthorizedUser',
        email: 'unauthorized@wepublish.ch',
        active: true,
        name: 'test-user',
        password: '123',
        roleIDs: [needApprovalRole.id]
      }
    })

    const date = new Date()
    date.setHours(date.getHours() + 1)

    const userSession = await prisma.session.create({
      data: {
        expiresAt: date,
        token: 'unauth123',
        userID: user.id
      }
    })

    const moderator = await prisma.user.create({
      data: {
        id: 'authorizedUser',
        email: 'authorized@wepublish.ch',
        active: true,
        name: 'test-user',
        password: '123',
        roleIDs: [needApprovalRole.id, authorizeCommentsRole.id]
      }
    })

    const moderatorSession = await prisma.session.create({
      data: {
        expiresAt: date,
        token: 'auth123',
        userID: moderator.id
      }
    })

    const clientAsUser = await createGraphQLTestClient({
      headers: {authorization: `Bearer ${userSession.token}`}
    } as any)
    clientPrivateAsUser = clientAsUser.testServerPrivate
    clientPublicAsUser = clientAsUser.testServerPublic

    const clientAsModerator = await createGraphQLTestClient({
      headers: {authorization: `Bearer ${moderatorSession.token}`}
    } as any)
    clientPrivateAsModerator = clientAsModerator.testServerPrivate
    clientPublicAsModerator = clientAsModerator.testServerPublic
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Comments', () => {
  describe('create', () => {
    test('can be created', async () => {
      const res = await clientPrivateAsAdmin.executeOperation({
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
            id: expect.any(String),
            createdAt: expect.any(Date),
            modifiedAt: expect.any(Date),
            revisions: expect.arrayContaining([
              expect.objectContaining({
                createdAt: expect.any(Date)
              })
            ])
          }
        }
      })
      expect(res.data.createComment.state).toBe('Approved')
      // expect(res?.data?.AddComment?.authorType).toContain(CommentAuthorType.Author)
    })

    describe('authorize permissions', () => {
      test('comment from a user with approval permission is approved', async () => {
        const res = await clientPrivateAsModerator.executeOperation({
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
              id: expect.any(String),
              createdAt: expect.any(Date),
              modifiedAt: expect.any(Date),
              revisions: expect.arrayContaining([
                expect.objectContaining({
                  createdAt: expect.any(Date)
                })
              ])
            }
          }
        })
        expect(res.data.createComment.state).toBe('Approved')
      })

      test('comment from a user without approval permission is pending approval', async () => {
        const res = await clientPrivateAsUser.executeOperation({
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
              id: expect.any(String),
              createdAt: expect.any(Date),
              modifiedAt: expect.any(Date),
              revisions: expect.arrayContaining([
                expect.objectContaining({
                  createdAt: expect.any(Date)
                })
              ])
            }
          }
        })
        expect(res.data.createComment.state).toBe('PendingApproval')
      })

      test('Public: comment from a user with approval permission is approved', async () => {
        const res = await clientPublicAsModerator.executeOperation({
          query: AddComment,
          variables: {
            input: {
              itemID: 'd',
              itemType: CommentItemType.Article,
              text: [
                {
                  type: 'paragraph',
                  children: [{text: 'hello'}]
                }
              ]
            }
          }
        })

        expect(res).toMatchSnapshot()
        expect(res.data.addComment.state).toBe('Approved')
      })
      test('Public: comment from a user without approval permission is pending approval', async () => {
        const res = await clientPublicAsUser.executeOperation({
          query: AddComment,
          variables: {
            input: {
              itemID: 'd',
              itemType: CommentItemType.Article,
              text: [
                {
                  type: 'paragraph',
                  children: [{text: 'hello'}]
                }
              ]
            }
          }
        })

        expect(res).toMatchSnapshot()
        expect(res.data.addComment.state).toBe('PendingApproval')
      })
    })
  })
})
