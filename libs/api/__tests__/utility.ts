import {CommentItemType, Event, Peer, PrismaClient, Subscription} from '@prisma/client'
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
  DefaultSessionTTL,
  FakeMailProvider,
  PayrexxPaymentProvider,
  GatewayClient,
  TransactionClient
} from '../src'
import {createUserSession} from '../src/lib/graphql/session/session.mutation'
import {PartialDeep} from 'type-fest'
import Mock = jest.Mock
import {CreateGatewayRequestData, Gateway} from '@wepublish/payment/api'

export interface TestClient {
  testServerPublic: ApolloServer
  testServerPrivate: ApolloServer
  prisma: PrismaClient
  challenge: AlgebraicCaptchaChallenge
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

  getSubscriptionURL(subscription: Subscription): string {
    return `https://demo.wepublish.ch/profile/subscription/${subscription.id}`
  }
}

export async function createGraphQLTestClientWithPrisma(): Promise<TestClient> {
  const prisma = new PrismaClient()
  await prisma.$connect()

  const adminUser = await prisma.user.findUnique({
    where: {
      email: 'dev@wepublish.ch'
    }
  })

  const userSession = await createUserSession(
    adminUser,
    DefaultSessionTTL,
    prisma.session,
    prisma.userRole
  )

  const request: any = {
    headers: {
      authorization: `Bearer ${userSession?.token}`
    }
  }
  return await createGraphQLTestClient(request)
}

export async function createGraphQLTestClient(overwriteRequest?: any): Promise<TestClient> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not defined')
  }

  const prisma = new PrismaClient()
  await prisma.$connect()

  const mailProvider = new FakeMailProvider({
    id: 'fakeMail',
    name: 'Fake Mail',
    fromAddress: 'fakeMail@wepublish.media'
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

  const challenge = new AlgebraicCaptchaChallenge('secret', 600, {})

  /**
   * Create mock payment adapter to be used along with test server.
   * @param implementation
   */
  function mockInstance<Type = unknown>(implementation?: PartialDeep<Type>) {
    return new (jest.fn().mockImplementation(() => implementation) as Mock<Type>)() as Type
  }
  const mockGatewayClient = mockInstance<GatewayClient>({
    createGateway: async (requestData: CreateGatewayRequestData): Promise<Gateway> => {
      return {
        id: 1234,
        status: 'confirmed',
        hash: '1234',
        referenceId: '1234',
        link: 'link',
        invoices: [],
        preAuthorization: true,
        fields: [],
        psp: [1],
        pm: ['1'],
        amount: 1,
        currency: 'chf',
        vatRate: 7.7,
        sku: 'sku',
        applicationFee: 10,
        createdAt: 1234567890
      }
    },
    getGateway: jest.fn()
  })
  const mockTransactionClient = mockInstance<TransactionClient>({
    retrieveTransaction: jest.fn(),
    chargePreAuthorizedTransaction: jest.fn()
  })

  const mockPaymentProvider = new PayrexxPaymentProvider({
    id: 'testing-payment-provider-id',
    name: 'Payrexx Testing Payment Provider',
    vatRate: 25,
    gatewayClient: mockGatewayClient,
    transactionClient: mockTransactionClient,
    psp: [14],
    offSessionPayments: true,
    webhookApiKey: 'secret',
    pm: ['foo']
  })

  const testServerPublic = new ApolloServer({
    schema: GraphQLWepublishPublicSchema,
    introspection: false,
    context: async ({req}) =>
      await contextFromRequest(overwriteRequest ? overwriteRequest : req, {
        hostURL: 'https://fakeURL',
        websiteURL: 'https://fakeurl',
        prisma,
        mediaAdapter,
        mailProvider,
        mailContextOptions: {
          defaultFromAddress: 'dev@fake.org',
          defaultReplyToAddress: 'reply-to@fake.org'
        },
        urlAdapter: new ExampleURLAdapter(),
        oauth2Providers: [],
        paymentProviders: [mockPaymentProvider],
        challenge
      })
  })

  const testServerPrivate = new ApolloServer({
    schema: GraphQLWepublishSchema,
    introspection: false,
    context: async ({req}) =>
      await contextFromRequest(overwriteRequest ? overwriteRequest : req, {
        hostURL: 'https://fakeURL',
        websiteURL: 'https://fakeurl',
        prisma,
        mediaAdapter,
        mailProvider,
        mailContextOptions: {
          defaultFromAddress: 'dev@fake.org',
          defaultReplyToAddress: 'reply-to@fake.org'
        },
        urlAdapter: new ExampleURLAdapter(),
        oauth2Providers: [],
        paymentProviders: [mockPaymentProvider],
        challenge
      })
  })

  return {
    testServerPublic,
    testServerPrivate,
    prisma,
    challenge
  }
}

export const generateRandomString = () => crypto.randomBytes(20).toString('hex')
