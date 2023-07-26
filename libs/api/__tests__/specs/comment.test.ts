import {ApolloServer} from 'apollo-server-express'
import {
  ApproveComment,
  ArticleInput,
  CreateArticle,
  CreateUser,
  UpdateComment,
  UserInput
} from '../api/private'

import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'
import {AddComment, CommentInput, CommentItemType, Comments} from '../api/public'

let testServerPrivate: ApolloServer
let testServerPublic: ApolloServer

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testServerPrivate = setupClient.testServerPrivate
    testServerPublic = setupClient.testServerPublic
  } catch (error) {
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
  let itemID = ''
  let commentID = ''

  beforeAll(async () => {
    // create Article that our Comment will relate to
    const articleInput: ArticleInput = {
      title: 'This is the best test article',
      slug: generateRandomString(),
      shared: false,
      tags: ['testing', 'awesome'],
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
