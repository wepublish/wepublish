import { Currency, PrismaClient } from '@prisma/client';
import { ApolloServer } from 'apollo-server-express';
import * as crypto from 'crypto';
import { URL } from 'url';
import {
  AlgebraicCaptchaChallenge,
  contextFromRequest,
  GraphQLWepublishPublicSchema,
  GraphQLWepublishSchema,
  DefaultSessionTTL,
} from '../src';
import { createUserSession } from '../src/lib/graphql/session/session.mutation';
import { PartialDeep } from 'type-fest';
import Mock = jest.Mock;
import {
  CreateGatewayRequestData,
  Gateway,
  GatewayClient,
  PayrexxFactoryProps,
  PayrexxPaymentProvider,
  TransactionClient,
} from '@wepublish/payment/api';
import { FakeMailProvider } from '@wepublish/mail/api';
import { URLAdapter } from '@wepublish/nest-modules';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import cacheManager from 'cache-manager';

export interface TestClient {
  testServerPublic: ApolloServer;
  testServerPrivate: ApolloServer;
  prisma: PrismaClient;
  challenge: AlgebraicCaptchaChallenge;
}

export async function createGraphQLTestClientWithPrisma(): Promise<TestClient> {
  const prisma = new PrismaClient();
  await prisma.$connect();

  const adminUser = await prisma.user.findUnique({
    where: {
      email: 'dev@wepublish.ch',
    },
  });

  const userSession = await createUserSession(
    adminUser,
    DefaultSessionTTL,
    prisma.session,
    prisma.userRole
  );

  const request: any = {
    headers: {
      authorization: `Bearer ${userSession?.token}`,
    },
  };
  return await createGraphQLTestClient(request);
}

export async function createGraphQLTestClient(
  overwriteRequest?: any
): Promise<TestClient> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not defined');
  }

  const prisma = new PrismaClient();
  await prisma.$connect();

  const cache = cacheManager.createCache();
  const kv = new KvTtlCacheService(cache);
  await kv.setNs('settings:mailprovider', 'fakeMail', {
    name: 'Fake Mail',
    fromAddress: 'fakeMail@wepublish.media',
  });

  const mailProvider = new FakeMailProvider({
    id: 'fakeMail',
    prisma,
    kv,
  });

  const mediaAdapter = {
    config: { quality: 1 },
    url: new URL('https://fakeurl.com'),
    token: 'fake',
    internalURL: new URL('https://internalurl.com'),
    getImageURL: jest.fn(),

    deleteImage: jest.fn(),
    uploadImage: jest.fn(),
    uploadImageFromArrayBuffer: jest.fn(),
    _uploadImage: jest.fn(),
  } as any;

  const challenge = new AlgebraicCaptchaChallenge('secret', 600, {});

  /**
   * Create mock payment adapter to be used along with test server.
   * @param implementation
   */
  function mockInstance<Type = unknown>(implementation?: PartialDeep<Type>) {
    return new (jest
      .fn()
      .mockImplementation(() => implementation) as Mock<Type>)() as Type;
  }

  const mockGatewayClient = mockInstance<GatewayClient>({
    createGateway: async (
      requestData: CreateGatewayRequestData
    ): Promise<Gateway> => {
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
        currency: Currency.CHF,
        vatRate: 7.7,
        sku: 'sku',
        applicationFee: 10,
        createdAt: 1234567890,
      };
    },
    getGateway: jest.fn(),
  });
  const mockTransactionClient = mockInstance<TransactionClient>({
    retrieveTransaction: jest.fn(),
    chargePreAuthorizedTransaction: jest.fn(),
  });

  class PayrexxFactoryMock {
    // keep signature compatible
    constructor(_props: PayrexxFactoryProps) {}

    get transactionClient(): TransactionClient {
      return mockTransactionClient;
    }
  }

  const mockPaymentProvider = new PayrexxPaymentProvider({
    id: 'testing-payment-provider-id',
    prisma,
    kv,
  });
  await kv.setNs(
    'settings:paymentprovider',
    'testing-payment-provider-id',
    JSON.stringify({
      id: 'testing-payment-provider-id',
      type: 'payrexx',
      name: 'Payrexx Testing Payment Provider',
      offSessionPayments: true,
      apiKey: 'secret',
      webhookEndpointSecret: 'secret',
      payrexx_instancename: 'instance',
      payrexx_psp: ['PAYPAL', 'TWINT', 'STRIPE'],
      payrexx_pm: ['PAYPAL', 'TWINT', 'APPLE_PAY'],
      payrexx_vatrate: 25,
    })
  );
  mockPaymentProvider.overridePayrexxFactory(PayrexxFactoryMock as any);

  const testServerPublic = new ApolloServer({
    schema: GraphQLWepublishPublicSchema,
    introspection: false,
    context: async ({ req }) =>
      await contextFromRequest(overwriteRequest ? overwriteRequest : req, {
        hostURL: 'https://fakeURL',
        websiteURL: 'https://fakeurl',
        prisma,
        mediaAdapter,
        mailProvider,
        kv,
        mailContextOptions: {
          defaultFromAddress: 'dev@fake.org',
          defaultReplyToAddress: 'reply-to@fake.org',
        },
        urlAdapter: new URLAdapter(''),
        paymentProviders: [mockPaymentProvider],
        challenge,
      }),
  });

  const testServerPrivate = new ApolloServer({
    schema: GraphQLWepublishSchema,
    introspection: false,
    context: async ({ req }) =>
      await contextFromRequest(overwriteRequest ? overwriteRequest : req, {
        hostURL: 'https://fakeURL',
        websiteURL: 'https://fakeurl',
        prisma,
        mediaAdapter,
        mailProvider,
        kv,
        mailContextOptions: {
          defaultFromAddress: 'dev@fake.org',
          defaultReplyToAddress: 'reply-to@fake.org',
        },
        urlAdapter: new URLAdapter(''),
        paymentProviders: [mockPaymentProvider],
        challenge,
      }),
  });

  return {
    testServerPublic,
    testServerPrivate,
    prisma,
    challenge,
  };
}

export const generateRandomString = () =>
  crypto.randomBytes(20).toString('hex');
