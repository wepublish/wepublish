import {CommentItemType, Event, Peer, PrismaClient} from '@prisma/client'
import {ApolloServer} from 'apollo-server-express'
import * as crypto from 'crypto'
import {URL} from 'url'
import {
  AlgebraicCaptchaChallenge,
  Article,
  Author,
  contextFromRequest,
  GraphQLWepublishPublicSchema,
  GraphQLWepublishSchema,
  KarmaMediaAdapter,
  PublicArticle,
  PublicComment,
  PublicPage,
  URLAdapter,
  DefaultSessionTTL
} from '../src'
import {createUserSession} from '../src/lib/graphql/session/session.mutation'

export interface TestClient {
  testServerPublic: ApolloServer
  testServerPrivate: ApolloServer
  prisma: PrismaClient
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

  getEventURL(event: Event): string {
    return `https://demo.wepublish.ch/events/${event.id}`
  }

  getArticlePreviewURL(token: string): string {
    return `https://demo.wepulish.ch/article/preview/${token}`
  }

  getPagePreviewURL(token: string): string {
    return `https://demo.wepulish.ch/page/preview/${token}`
  }

  getCommentURL(item: PublicArticle | PublicPage, comment: PublicComment, peer?: Peer): string {
    if (comment.itemType === CommentItemType.article) {
      return `https://demo.wepublish.media/comments/a/${item.id}/${item.slug}/${comment.id}`
    }

    if (comment.itemType === CommentItemType.peerArticle) {
      return `https://demo.wepublish.media/comments/p/${peer?.id}/${item.id}#${comment.id}`
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

  const testServerPublic = new ApolloServer({
    schema: GraphQLWepublishPublicSchema,
    introspection: false,
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

  const testServerPrivate = new ApolloServer({
    schema: GraphQLWepublishSchema,
    introspection: false,
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

  return {
    testServerPublic,
    testServerPrivate,
    prisma
  }
}

export const generateRandomString = () => crypto.randomBytes(20).toString('hex')
