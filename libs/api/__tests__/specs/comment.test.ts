import {
  CommentItemType,
  ApproveComment,
  ArticleInput,
  CreateArticle,
  CreateUser,
  UpdateComment,
  CreateComment,
  UserInput
} from '../api/private'
import {createGraphQLTestClient} from '../utility'
import {ApolloServer} from 'apollo-server-express'
import {PrismaClient} from '@prisma/client'
import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'
import {AddComment, CommentInput, Comments} from '../api/public'

let clientPrivateAsAdmin: ApolloServer
let clientPublicAsUser: ApolloServer
let clientPublicAsModerator: ApolloServer
let clientPrivateAsUser: ApolloServer
let clientPrivateAsModerator: ApolloServer
let prisma: PrismaClient
let testServerPrivate: ApolloServer
let testServerPublic: ApolloServer

let itemID = ''
let commentID = ''

beforeAll(async () => {
  try {
    const clientAsAdmin = await createGraphQLTestClientWithPrisma()
    const setupClient = await createGraphQLTestClientWithPrisma()
    clientPrivateAsAdmin = clientAsAdmin.testServerPrivate
    testServerPrivate = setupClient.testServerPrivate
    testServerPublic = setupClient.testServerPublic

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
    const articleInput: ArticleInput = {
      title: 'This is the best test article',
      slug: generateRandomString(),
      shared: false,
      hidden: false,
      tags: [],
      breaking: true,
      lead: 'This article will rock your world. Never has there been a better article',
      preTitle: 'Testing GraphQL',
      hideAuthor: false,
      properties: [
        {key: 'testingKey', value: 'testingValue', public: true},
        {key: 'privateTestingKey', value: 'privateTestingValue', public: false}
      ],
      authorIDs: [],
      socialMediaTitle: 'A social media title',
      socialMediaAuthorIDs: [],
      socialMediaDescription: 'A social media description',
      socialMediaImageID: null,
      blocks: []
    }
    const articleRes = await testServerPrivate.executeOperation({
      query: CreateArticle,
      variables: {
        input: articleInput
      }
    })

    itemID = articleRes.data?.createArticle.id

    // create Comment and pass created Article ID
    const input: CommentInput = {
      itemID: articleRes.data?.createArticle.id,
      itemType: CommentItemType.Article,
      text: richTextNodes
    }
    const commentRes = await testServerPublic.executeOperation({
      query: AddComment,
      variables: {
        input
      }
    })

    commentID = commentRes.data.addComment.id

    // approve Comment by id so it can be retrieved
    await testServerPrivate.executeOperation({
      query: ApproveComment,
      variables: {
        id: commentID
      }
    })
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

const richTextNodes = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'p text rich text'
      }
    ]
  }
]

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

        expect(res).toMatchSnapshot({
          data: {
            addComment: {
              id: expect.any(String),
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

        expect(res).toMatchSnapshot({
          data: {
            addComment: {
              id: expect.any(String),
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
        expect(res.data.addComment.state).toBe('PendingApproval')
      })
    })
  })

  test('can be created with bare minimum', async () => {
    const input: CommentInput = {
      itemID,
      itemType: CommentItemType.Article,
      text: richTextNodes
    }
    const res = await testServerPublic.executeOperation({
      query: AddComment,
      variables: {
        input
      }
    })

    expect(res).toMatchSnapshot({
      data: {
        addComment: {
          id: expect.any(String),
          itemID: expect.any(String),
          parentID: null,
          text: expect.any(Object),
          user: expect.any(Object)
        }
      }
    })
  })

  test('can get comments', async () => {
    const getComments = await testServerPublic.executeOperation({
      query: Comments,
      variables: {
        itemID
      }
    })

    expect(getComments.data.comments).not.toHaveLength(0)
  })

  test('sensitive data of the user associated with the comment is not hidden if the user is me', async () => {
    const getComments = await testServerPublic.executeOperation({
      query: Comments,
      variables: {
        itemID
      }
    })

    expect(getComments.data?.comments[0].user.email).toEqual('dev@wepublish.ch')
  })

  test('sensitive data of the user associated with the comment is hidden if the user is not me', async () => {
    // create a new User
    const newUserEmail = `${generateRandomString()}@wepublish.ch`
    const input: UserInput = {
      name: 'Wayne',
      firstName: 'Bruce',
      preferredName: 'Batman',
      flair: 'Superhero',
      email: newUserEmail,
      emailVerifiedAt: new Date().toISOString(),
      properties: [],
      active: true,
      roleIDs: []
    }
    const res = await testServerPrivate.executeOperation({
      query: CreateUser,
      variables: {
        input,
        password: 'p@$$w0rd'
      }
    })

    // update Comment and change related user id
    await testServerPrivate.executeOperation({
      query: UpdateComment,
      variables: {
        id: commentID,
        userID: res.data?.createUser.id
      }
    })

    // get Comments
    const getComments = await testServerPublic.executeOperation({
      query: Comments,
      variables: {
        itemID
      }
    })

    // I shouldn't be able to see en email of the user if it's not me
    expect(getComments.data?.comments[0].user).toMatchSnapshot({
      id: expect.any(String)
    })
  })
})
