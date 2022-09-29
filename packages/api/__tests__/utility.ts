import {CommentItemType, Peer, PrismaClient} from '@prisma/client'
import {KarmaMediaAdapter} from '@wepublish/api-media-karma/src'
import {ApolloServer} from 'apollo-server'
import {createTestClient} from 'apollo-server-testing'
import {ApolloServerTestClient} from 'apollo-server-testing/dist/createTestClient'
import * as crypto from 'crypto'
import {URL} from 'url'
import {
  AlgebraicCaptchaChallenge,
  Article,
  Author,
  contextFromRequest,
  GraphQLWepublishPublicSchema,
  GraphQLWepublishSchema,
  PublicArticle,
  PublicComment,
  PublicPage,
  URLAdapter
} from '../src'
import {DefaultSessionTTL} from '../src/db/common'
import {createUserSession} from '../src/graphql/session/session.mutation'

export interface TestClient {
  testClientPublic: ApolloServerTestClient
  testClientPrivate: ApolloServerTestClient
}

class ExampleURLAdapter implements URLAdapter {
  getPublicArticleURL(article: PublicArticle): string {
    return `https://demo.wepublish.ch/article/${article.id}/${article.slug}`
  }

  getPublicPageURL(page: PublicPage): string {
    return `https://demo.wepublish.ch/page/${page.id}/${page.slug}`
  }

  getPeeredArticleURL(peer: Peer, article: Article): string {
    return `https://demo.wepublish.ch/peerArticle/${peer.id}/${article.id}`
  }

  getAuthorURL(author: Author): string {
    return `https://demo.wepublish.ch/author/${author.slug || author.id}`
  }

  getArticlePreviewURL(token: string): string {
    return `https://demo.wepulish.ch/article/preview/${token}`
  }

  getPagePreviewURL(token: string): string {
    return `https://demo.wepulish.ch/page/preview/${token}`
  }

  getCommentURL(item: PublicArticle | PublicPage, comment: PublicComment): string {
    if (comment.itemType === CommentItemType.article) {
      return `https://demo.wepublish.media/comments/a/${item.id}/${item.slug}/${comment.id}`
    }
    return `https://demo.wepublish.media/comments/${item.slug}/${comment.id}`
  }

  getLoginURL(token: string): string {
    return `https://demo.wepublish.ch/login/${token}`
  }
}

export async function createGraphQLTestClientWithPrisma(): Promise<TestClient> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not defined')
  }

  const prisma = new PrismaClient()
  await prisma.$connect()

  const adminUser = await prisma.user.findUnique({
    where: {
      email: 'dev@wepublish.ch'
    }
  })

  const mediaAdapter: KarmaMediaAdapter = {
    url: new URL('https://fakeurl.com'),
    token: 'fake',
    internalURL: new URL('https://internalurl.com'),
    getImageURL: jest.fn(),

    deleteImage: jest.fn(),
    uploadImage: jest.fn(),
    uploadImageFromArrayBuffer: jest.fn(),
    _uploadImage: jest.fn()
  }

  const userSession = await createUserSession(
    adminUser!,
    DefaultSessionTTL,
    prisma.session,
    prisma.userRole
  )

  const request: any = {
    headers: {
      authorization: `Bearer ${userSession?.token}`
    }
  }

  const challenge = new AlgebraicCaptchaChallenge('secret', 600, {})

  const apolloServerPublic = new ApolloServer({
    schema: GraphQLWepublishPublicSchema,
    playground: false,
    introspection: false,
    tracing: false,
    context: async () =>
      await contextFromRequest(request, {
        hostURL: 'https://fakeURL',
        websiteURL: 'https://fakeurl',
        prisma,
        mediaAdapter,
        mailContextOptions: {
          defaultFromAddress: 'dev@fake.org',
          defaultReplyToAddress: 'reply-to@fake.org',
          mailTemplateMaps: []
        },
        urlAdapter: new ExampleURLAdapter(),
        oauth2Providers: [],
        paymentProviders: [],
        challenge
      })
  })

  const apolloServerPrivate = new ApolloServer({
    schema: GraphQLWepublishSchema,
    playground: false,
    introspection: false,
    tracing: false,
    context: async () =>
      await contextFromRequest(request, {
        hostURL: 'https://fakeURL',
        websiteURL: 'https://fakeurl',
        prisma,
        mediaAdapter,
        mailContextOptions: {
          defaultFromAddress: 'dev@fake.org',
          defaultReplyToAddress: 'reply-to@fake.org',
          mailTemplateMaps: []
        },
        urlAdapter: new ExampleURLAdapter(),
        oauth2Providers: [],
        paymentProviders: [],
        challenge
      })
  })

  const testClientPrivate = createTestClient(apolloServerPrivate)
  const testClientPublic = createTestClient(apolloServerPublic)

  return {
    testClientPublic,
    testClientPrivate
  }
}

export const generateRandomString = () => crypto.randomBytes(20).toString('hex')
