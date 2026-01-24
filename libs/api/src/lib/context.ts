import { ExecutionRequest, Executor } from '@graphql-tools/utils';
import { schemaFromExecutor, wrapSchema } from '@graphql-tools/wrap';
import {
  Author,
  Comment,
  CommentRatingSystemAnswer,
  Image,
  MailLog,
  Payment,
  PaymentMethod,
  PaymentState,
  Peer,
  PrismaClient,
  User,
  UserRole,
} from '@prisma/client';
import {
  AuthenticationService,
  AuthSession,
  AuthSessionType,
  TokenSession,
  UserSession,
} from '@wepublish/authentication/api';
import { MediaAdapter } from '@wepublish/image/api';
import {
  BaseMailProvider,
  MailContext,
  MailContextOptions,
} from '@wepublish/mail/api';
import { InvoiceWithItems, PaymentProvider } from '@wepublish/payment/api';
import { SettingName } from '@wepublish/settings/api';
import {
  createOptionalsArray,
  generateJWT,
  GenerateJWTProps,
  logger,
} from '@wepublish/utils/api';
import AbortController from 'abort-controller';
import { AuthenticationError } from 'apollo-server-express';
import crypto from 'crypto';
import DataLoader from 'dataloader';
import { GraphQLError, GraphQLSchema, print } from 'graphql';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';
import fetch from 'node-fetch';
import { ChallengeProvider } from './challenges/challengeProvider';
import { DefaultBcryptHashCostFactor, DefaultSessionTTL } from './db/common';
import { MemberPlanWithPaymentMethods } from './db/memberPlan';
import { SubscriptionWithRelations } from './db/subscription';
import { TokenExpiredError } from './error';
import { FullPoll, getPoll } from './graphql/poll/poll.public-queries';
import { Hooks } from './hooks';
import { MemberContext } from '@wepublish/membership/api';
import { BlockStylesDataloaderService } from '@wepublish/block-content/api';
import { URLAdapter } from '@wepublish/nest-modules';
import { createSafeHostUrl } from '@wepublish/peering/api';

/**
 * Peered article cache configuration and setup
 */
const ONE_HOUR_IN_SEC = 60 * 60;
const ONE_MIN_IN_SEC = 60;
const fetcherCache = new NodeCache({
  stdTTL: ONE_HOUR_IN_SEC,
  checkperiod: ONE_MIN_IN_SEC,
  deleteOnExpire: true,
  useClones: true,
});

export interface DataLoaderContext {
  readonly authorsByID: DataLoader<string, Author | null>;
  readonly authorsBySlug: DataLoader<string, Author | null>;

  readonly images: DataLoader<string, Image | null>;

  readonly userRolesByID: DataLoader<string, UserRole | null>;

  readonly mailLogsByID: DataLoader<string, MailLog | null>;

  readonly peer: DataLoader<string, Peer | null>;
  readonly peerBySlug: DataLoader<string, Peer | null>;

  readonly peerSchema: DataLoader<string, GraphQLSchema | null>;
  readonly peerAdminSchema: DataLoader<string, GraphQLSchema | null>;

  readonly memberPlansByID: DataLoader<
    string,
    MemberPlanWithPaymentMethods | null
  >;
  readonly memberPlansBySlug: DataLoader<
    string,
    MemberPlanWithPaymentMethods | null
  >;
  readonly activeMemberPlansByID: DataLoader<
    string,
    MemberPlanWithPaymentMethods | null
  >;
  readonly activeMemberPlansBySlug: DataLoader<
    string,
    MemberPlanWithPaymentMethods | null
  >;
  readonly paymentMethodsByID: DataLoader<string, PaymentMethod | null>;
  readonly activePaymentMethodsByID: DataLoader<string, PaymentMethod | null>;
  readonly activePaymentMethodsBySlug: DataLoader<string, PaymentMethod | null>;
  readonly invoicesByID: DataLoader<string, InvoiceWithItems | null>;
  readonly paymentsByID: DataLoader<string, Payment | null>;

  readonly pollById: DataLoader<string, FullPoll | null>;

  readonly commentsById: DataLoader<string, Comment | null>;
  readonly commentRatingSystemAnswers: DataLoader<
    1,
    CommentRatingSystemAnswer[]
  >;
  readonly subscriptionsById: DataLoader<
    string,
    SubscriptionWithRelations | null
  >;
  readonly usersById: DataLoader<string, User | null>;

  readonly blockStyleById: BlockStylesDataloaderService;
}

export interface Context {
  readonly hostURL: string;
  readonly websiteURL: string;
  readonly sessionTTL: number;
  readonly hashCostFactor: number;

  readonly session: AuthSession | null;
  readonly loaders: DataLoaderContext;

  readonly mailContext: MailContext;
  readonly memberContext: MemberContext;

  readonly prisma: PrismaClient;
  readonly mediaAdapter: MediaAdapter;
  readonly urlAdapter: URLAdapter;
  readonly paymentProviders: PaymentProvider[];
  readonly hooks?: Hooks;
  readonly challenge: ChallengeProvider;
  readonly requestIP: string;
  readonly fingerprint: string;

  authenticate(): AuthSession;

  authenticateToken(): TokenSession;

  authenticateUser(): UserSession;

  optionalAuthenticateUser(): UserSession | null;

  generateJWT(
    props: Pick<GenerateJWTProps, 'id' | 'audience' | 'expiresInMinutes'>
  ): string;

  verifyJWT(token: string): string;

  createPaymentWithProvider(props: CreatePaymentWithProvider): Promise<Payment>;
}

interface PeerQueryParams {
  cacheKey: string;
  readonly hostURL: string;
  readonly variables: { [p: string]: any } | undefined;
  readonly query: string;
  readonly operationName: string | undefined;
  readonly token: string;
  readonly timeout: number;
}

interface PeerCacheValue {
  queryParams: PeerQueryParams;
  data: any;
}

export interface ContextOptions {
  readonly hostURL: string;
  readonly websiteURL: string;
  readonly sessionTTL?: number;
  readonly hashCostFactor?: number;

  readonly prisma: PrismaClient;
  readonly mediaAdapter: MediaAdapter;
  readonly urlAdapter: URLAdapter;
  readonly mailProvider: BaseMailProvider;
  readonly mailContextOptions: MailContextOptions;
  readonly paymentProviders: PaymentProvider[];
  readonly hooks?: Hooks;
  readonly challenge: ChallengeProvider;
}

export interface SendMailFromProviderProps {
  recipient: string;
  replyToAddress: string;
  subject: string;
  message?: string;
  template?: string;
  templateData?: Record<string, any>;
}

export interface CreatePaymentWithProvider {
  paymentMethodID: string;
  invoice: InvoiceWithItems;
  saveCustomer: boolean;
  successURL?: string;
  failureURL?: string;
  user?: User;
  migrateToTargetPaymentMethodID?: string;
}

export async function contextFromRequest(
  req: IncomingMessage | null,
  {
    hostURL,
    websiteURL,
    prisma,
    mediaAdapter,
    urlAdapter,
    hooks,
    mailProvider,
    mailContextOptions,
    paymentProviders,
    challenge,
    sessionTTL,
    hashCostFactor,
  }: ContextOptions
): Promise<Context> {
  const authService = new AuthenticationService(prisma);

  const token = tokenFromRequest(req);
  const requestIP = IPFromRequest(req);
  const fingerprint = fingerprintRequest(req, requestIP);
  const session = token ? await authService.getSessionByToken(token) : null;
  const isSessionValid = authService.isSessionValid(session);

  const peerDataLoader = new DataLoader(async ids =>
    createOptionalsArray(
      ids as string[],
      await prisma.peer.findMany({
        where: {
          id: {
            in: ids as string[],
          },
        },
      }),
      'id'
    )
  );

  const loaders: DataLoaderContext = {
    authorsByID: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.author.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
          include: {
            links: true,
          },
        }),
        'id'
      )
    ),
    authorsBySlug: new DataLoader(async slugs =>
      createOptionalsArray(
        slugs as string[],
        await prisma.author.findMany({
          where: {
            slug: {
              in: slugs as string[],
            },
          },
          include: {
            links: true,
          },
        }),
        'slug'
      )
    ),

    images: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.image.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
          include: {
            focalPoint: true,
          },
        }),
        'id'
      )
    ),

    userRolesByID: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.userRole.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      )
    ),

    mailLogsByID: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.mailLog.findMany({
          where: {
            mailIdentifier: {
              in: ids as string[],
            },
          },
        }),
        'id'
      )
    ),

    peer: peerDataLoader,
    peerBySlug: new DataLoader(async slugs =>
      createOptionalsArray(
        slugs as string[],
        await prisma.peer.findMany({
          where: {
            slug: {
              in: slugs as string[],
            },
          },
        }),
        'slug'
      )
    ),

    peerSchema: new DataLoader(async ids => {
      const peers = await peerDataLoader.loadMany(ids);

      return Promise.all(
        peers.map(async peer => {
          try {
            if (!peer) return null;

            if (peer instanceof Error) {
              console.error(peer);
              return null;
            }
            const peerTimeout =
              ((
                await prisma.setting.findUnique({
                  where: { name: SettingName.PEERING_TIMEOUT_MS },
                })
              )?.value as number) ||
              parseInt(process.env['PEERING_TIMEOUT_IN_MS'] as string) ||
              10 * 1000; // 10 Seconds timeout in  ms
            const fetcher = createFetcher(
              createSafeHostUrl(peer.hostURL, 'v1'),
              peer.token,
              peerTimeout
            );

            return wrapSchema({
              schema: await schemaFromExecutor(fetcher),
              executor: fetcher,
            });
          } catch (err) {
            console.error(err);
            return null;
          }
        })
      );
    }),

    peerAdminSchema: new DataLoader(async ids => {
      const peers = await peerDataLoader.loadMany(ids);

      return Promise.all(
        peers.map(async peer => {
          try {
            if (!peer) return null;

            if (peer instanceof Error) {
              console.error(peer);
              return null;
            }
            const peerTimeout =
              ((
                await prisma.setting.findUnique({
                  where: { name: SettingName.PEERING_TIMEOUT_MS },
                })
              )?.value as number) ||
              parseInt(process.env['PEERING_TIMEOUT_IN_MS'] as string) ||
              10 * 1000; // 10 Seconds timeout in  ms

            const fetcher = createFetcher(
              createSafeHostUrl(peer.hostURL, 'v1/admin'),
              peer.token,
              peerTimeout
            );

            return wrapSchema({
              schema: await schemaFromExecutor(fetcher),
              executor: fetcher,
            });
          } catch (err) {
            console.error(err);
            return null;
          }
        })
      );
    }),

    memberPlansByID: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.memberPlan.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
          include: {
            availablePaymentMethods: true,
          },
        }),
        'id'
      )
    ),
    memberPlansBySlug: new DataLoader(async slugs =>
      createOptionalsArray(
        slugs as string[],
        await prisma.memberPlan.findMany({
          where: {
            slug: {
              in: slugs as string[],
            },
          },
          include: {
            availablePaymentMethods: true,
          },
        }),
        'slug'
      )
    ),
    activeMemberPlansByID: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.memberPlan.findMany({
          where: {
            id: {
              in: ids as string[],
            },
            active: true,
          },
          include: {
            availablePaymentMethods: true,
          },
        }),
        'id'
      )
    ),
    activeMemberPlansBySlug: new DataLoader(async slugs =>
      createOptionalsArray(
        slugs as string[],
        await prisma.memberPlan.findMany({
          where: {
            slug: {
              in: slugs as string[],
            },
            active: true,
          },
          include: {
            availablePaymentMethods: true,
          },
        }),
        'slug'
      )
    ),
    paymentMethodsByID: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.paymentMethod.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      )
    ),
    activePaymentMethodsByID: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.paymentMethod.findMany({
          where: {
            id: {
              in: ids as string[],
            },
            active: true,
          },
        }),
        'id'
      )
    ),
    activePaymentMethodsBySlug: new DataLoader(async slugs =>
      createOptionalsArray(
        slugs as string[],
        await prisma.paymentMethod.findMany({
          where: {
            slug: {
              in: slugs as string[],
            },
            active: true,
          },
        }),
        'slug'
      )
    ),
    invoicesByID: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.invoice.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
          include: {
            items: true,
          },
        }),
        'id'
      )
    ),
    paymentsByID: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.payment.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      )
    ),

    pollById: new DataLoader(async ids =>
      Promise.all(ids.map(id => getPoll(id, prisma.poll)))
    ),

    commentsById: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.comment.findMany({
          where: {
            id: { in: ids as string[] },
          },
          include: {
            overriddenRatings: true,
            revisions: { orderBy: { createdAt: 'asc' } },
          },
        }),
        'id'
      )
    ),

    commentRatingSystemAnswers: new DataLoader(async () => [
      await prisma.commentRatingSystemAnswer.findMany(),
    ]),

    subscriptionsById: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.subscription.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
          include: {
            periods: true,
            properties: true,
            deactivation: true,
          },
        }),
        'id'
      )
    ),

    usersById: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.user.findMany({
          where: {
            id: { in: ids as string[] },
          },
          include: { address: true },
        }),
        'id'
      )
    ),

    blockStyleById: new BlockStylesDataloaderService(prisma),
  };

  const mailContext = new MailContext({
    prisma,
    mailProvider,
    defaultFromAddress: mailContextOptions.defaultFromAddress,
    defaultReplyToAddress: mailContextOptions.defaultReplyToAddress,
  });

  const generateJWTWrapper: Context['generateJWT'] = ({
    expiresInMinutes,
    audience,
    id,
  }): string => {
    if (!process.env['JWT_SECRET_KEY'])
      throw new Error('No JWT_SECRET_KEY defined in environment.');

    return generateJWT({
      id,
      secret: process.env['JWT_SECRET_KEY'],
      issuer: hostURL,
      audience: audience ?? websiteURL,
      expiresInMinutes,
    });
  };

  const verifyJWT = (token: string): string => {
    if (!process.env['JWT_SECRET_KEY'])
      throw new Error('No JWT_SECRET_KEY defined in environment.');
    const ver = jwt.verify(token, process.env['JWT_SECRET_KEY']);
    return typeof ver === 'object' && 'sub' in ver ?
        (ver as Record<string, any>)['sub']
      : '';
  };

  const memberContext = new MemberContext({
    prisma,
    paymentProviders,
    mailContext,
  });

  return {
    hostURL,
    websiteURL,
    session: isSessionValid ? session : null,
    loaders,
    prisma,
    memberContext,
    mailContext,
    mediaAdapter,
    urlAdapter,
    paymentProviders,
    hooks,
    requestIP: requestIP ?? '',
    fingerprint: fingerprint ?? '',
    sessionTTL: sessionTTL ?? DefaultSessionTTL,
    hashCostFactor: hashCostFactor ?? DefaultBcryptHashCostFactor,

    authenticateUser() {
      if (!session || session.type !== AuthSessionType.User) {
        throw new AuthenticationError('Invalid user session!');
      }

      if (!isSessionValid) {
        throw new TokenExpiredError();
      }

      return session;
    },

    optionalAuthenticateUser() {
      if (
        !session ||
        session.type !== AuthSessionType.User ||
        !isSessionValid
      ) {
        return null;
      }

      return session;
    },

    authenticateToken() {
      if (!session || session.type !== AuthSessionType.Token) {
        throw new AuthenticationError('Invalid token session!');
      }

      return session;
    },

    authenticate() {
      if (!session) {
        throw new AuthenticationError('Invalid session!');
      }

      if (!isSessionValid) {
        throw new TokenExpiredError();
      }

      return session;
    },

    generateJWT: generateJWTWrapper,

    verifyJWT,

    async createPaymentWithProvider({
      paymentMethodID,
      invoice,
      saveCustomer,
      failureURL,
      successURL,
      user,
      migrateToTargetPaymentMethodID,
    }: CreatePaymentWithProvider): Promise<Payment> {
      const paymentMethod = await loaders.activePaymentMethodsByID.load(
        migrateToTargetPaymentMethodID || paymentMethodID
      );
      const paymentProvider = paymentProviders.find(
        pp => pp.id === paymentMethod?.paymentProviderID
      );

      if (!paymentProvider) {
        throw new Error('paymentProvider not found');
      }

      if (!invoice.subscriptionID) {
        throw new Error('Subscription not found');
      }

      /**
       * Gradually migrate subscription's payment method.
       * Mainly used in mutation.public.ts
       * Requirements written down here https://wepublish.atlassian.net/browse/TSRI-98
       */
      if (migrateToTargetPaymentMethodID) {
        await prisma.subscription.update({
          data: {
            paymentMethodID: migrateToTargetPaymentMethodID,
          },
          where: {
            id: invoice.subscriptionID,
          },
        });
      }

      await prisma.subscription.update({
        data: {
          confirmed: true,
        },
        where: {
          id: invoice.subscriptionID,
        },
      });

      const payment = await prisma.payment.create({
        data: {
          paymentMethodID,
          invoiceID: invoice.id,
          state: PaymentState.created,
        },
      });

      const customer =
        user ?
          await prisma.paymentProviderCustomer.findFirst({
            where: {
              userId: user.id,
              paymentProviderID: paymentMethod?.paymentProviderID,
            },
          })
        : null;

      const intent = await paymentProvider.createIntent({
        paymentID: payment.id,
        invoice,
        currency: invoice.currency,
        saveCustomer,
        successURL,
        failureURL,
        customerID: customer?.customerID,
      });

      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          state: intent.state,
          intentID: `${intent.intentID}`,
          intentData: intent.intentData,
          intentSecret: intent.intentSecret,
          paymentData: intent.paymentData,
          paymentMethodID: payment.paymentMethodID,
          invoiceID: payment.invoiceID,
        },
      });

      // Mark invoice as paid
      if (intent.state === PaymentState.paid) {
        const intentState = await paymentProvider.checkIntentStatus({
          intentID: updatedPayment.intentID ?? '',
          paymentID: updatedPayment.id,
        });

        await paymentProvider.updatePaymentWithIntentState({ intentState });
      }

      if (intent.errorCode) {
        throw new GraphQLError(intent.errorCode);
      }

      return updatedPayment as Payment;
    },
    challenge,
  };
}

export function tokenFromRequest(req: IncomingMessage | null): string | null {
  if (req?.headers.authorization) {
    const [, token] = req.headers.authorization.match(/Bearer (.+?$)/i) || [];
    return token || null;
  }

  return null;
}

export function fingerprintRequest(
  req: IncomingMessage | null,
  ip: string | undefined
): string | null {
  let ipHash = null;
  if (ip) {
    ipHash = crypto
      .createHash('sha224')
      .update(ip)
      .digest('hex')
      .substring(0, 7);
  }
  let userAgentHash = null;
  if (req?.headers['user-agent']) {
    userAgentHash = crypto
      .createHash('sha224')
      .update(req?.headers['user-agent'])
      .digest('hex')
      .substring(0, 7);
  }
  if (ipHash || userAgentHash) return `${ipHash}:${userAgentHash}`;
  return null;
}

export function IPFromRequest(req: IncomingMessage | null): string | undefined {
  const headers = req?.headers;
  if (headers) {
    return (
      (headers['cf-connecting-ip'] as string | undefined) ||
      (headers['x-forwarded-for'] as string | undefined) ||
      req.socket?.remoteAddress ||
      undefined
    );
  }
  return undefined;
}

/**
 * Function that generate the key for the cache
 * @param params
 */
function generateCacheKey(params: PeerQueryParams) {
  return (
    crypto
      // Hash function doesn't have to be crypto safe, just fast!
      .createHash('md5')
      .update(
        `${JSON.stringify(params.hostURL)}${JSON.stringify(params.variables)}${JSON.stringify(
          params.query
        )}`
      )
      .digest('hex')
  );
}

/**
 * Function that refreshes and initializes entries in the cache
 * @param params
 */

async function loadFreshData(params: PeerQueryParams) {
  try {
    const abortController = new AbortController();

    const peerTimeOut = params.timeout ? params.timeout : 10 * 1000; // 10 Seconds timeout in  ms

    // Since we use auto refresh cache we can safely set the timeout to 3sec
    setTimeout(() => abortController.abort(), peerTimeOut);

    const fetchResult = await fetch(params.hostURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify({
        query: params.query,
        variables: params.variables,
        operationName: params.operationName,
      }),
      signal: abortController.signal,
    });
    const res = await fetchResult.json();
    if (fetchResult?.status !== 200) {
      return {
        errors: [
          new GraphQLError(
            `Peer responded with invalid status: ${fetchResult?.status}`
          ),
        ],
      };
    }
    const cacheValue: PeerCacheValue = {
      data: res,
      queryParams: params,
    };
    fetcherCache.set(params.cacheKey, cacheValue);
    return res;
  } catch (err) {
    let errorMessage = err;
    if ((err as any).type === 'aborted') {
      errorMessage = new Error(
        `Connection to peer (${params.hostURL}) timed out.`
      );
    }
    logger('context').error(`${errorMessage}`);
    return { errors: [err] };
  }
}

export function createFetcher(
  hostURL: string,
  token: string,
  peerTimeOut: number
): Executor {
  const loadData = async ({
    query,
    variables,
    operationName,
  }: { query: string } & Omit<ExecutionRequest, 'document' | 'context'>) => {
    // Initialize and prepare caching
    const fetchParams: PeerQueryParams = {
      hostURL,
      variables,
      query,
      operationName,
      token,
      cacheKey: '',
      timeout: peerTimeOut,
    };

    fetchParams.cacheKey = generateCacheKey(fetchParams);
    const cachedData = fetcherCache.get<PeerCacheValue>(fetchParams.cacheKey);

    if (cachedData) {
      // Serve cached entries direct
      return cachedData.data;
    }

    return await loadFreshData(fetchParams);
  };

  return async ({ variables, operationName, document }) => {
    const query = print(document);

    return loadData({ query, variables, operationName });
  };
}
