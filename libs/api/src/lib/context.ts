import {ExecutionRequest, Executor} from '@graphql-tools/utils'
import {schemaFromExecutor, wrapSchema} from '@graphql-tools/wrap'
import {
  Author,
  Comment,
  CommentRatingSystemAnswer,
  Event,
  Image,
  MailLog,
  Payment,
  PaymentMethod,
  PaymentState,
  Peer,
  PrismaClient,
  TaggedArticles,
  TaggedPages,
  User,
  UserRole
} from '@prisma/client'
import {
  AuthSession,
  AuthSessionType,
  AuthenticationService,
  TokenSession,
  UserSession
} from '@wepublish/authentication/api'
import {MediaAdapter} from '@wepublish/image/api'
import {BaseMailProvider, MailContext, MailContextOptions} from '@wepublish/mail/api'
import {InvoiceWithItems, PaymentProvider} from '@wepublish/payment/api'
import {SettingName} from '@wepublish/settings/api'
import {GenerateJWTProps, createOptionalsArray, generateJWT, logger} from '@wepublish/utils/api'
import AbortController from 'abort-controller'
import {AuthenticationError} from 'apollo-server-express'
import crypto from 'crypto'
import DataLoader from 'dataloader'
import {GraphQLError, GraphQLSchema, print} from 'graphql'
import {IncomingMessage} from 'http'
import jwt from 'jsonwebtoken'
import NodeCache from 'node-cache'
import fetch from 'node-fetch'
import {Client, Issuer} from 'openid-client'
import {ChallengeProvider} from './challenges/challengeProvider'
import {
  ArticleWithRevisions,
  PublicArticle,
  articleWithRevisionsToPublicArticle
} from './db/article'
import {DefaultBcryptHashCostFactor, DefaultSessionTTL} from './db/common'
import {MemberPlanWithPaymentMethods} from './db/memberPlan'
import {NavigationWithLinks} from './db/navigation'
import {PageWithRevisions, PublicPage, pageWithRevisionsToPublicPage} from './db/page'
import {SubscriptionWithRelations} from './db/subscription'
import {TokenExpiredError} from './error'
import {getEvent} from './graphql/event/event.query'
import {createSafeHostUrl} from './graphql/peer/create-safe-host-url'
import {FullPoll, getPoll} from './graphql/poll/poll.public-queries'
import {Hooks} from './hooks'
import {MemberContext} from './memberContext'
import {URLAdapter} from './urlAdapter'
import {BlockStylesDataloaderService} from '@wepublish/block-content/api'

/**
 * Peered article cache configuration and setup
 */
const ONE_HOUR_IN_SEC = 60 * 60
const ONE_MIN_IN_SEC = 60
const fetcherCache = new NodeCache({
  stdTTL: ONE_HOUR_IN_SEC,
  checkperiod: ONE_MIN_IN_SEC,
  deleteOnExpire: true,
  useClones: true
})

export interface DataLoaderContext {
  readonly navigationByID: DataLoader<string, NavigationWithLinks | null>
  readonly navigationByKey: DataLoader<string, NavigationWithLinks | null>

  readonly authorsByID: DataLoader<string, Author | null>
  readonly authorsBySlug: DataLoader<string, Author | null>

  readonly images: DataLoader<string, Image | null>

  readonly articles: DataLoader<string, (ArticleWithRevisions & {tags: TaggedArticles[]}) | null>
  readonly publicArticles: DataLoader<string, PublicArticle | null>

  readonly pages: DataLoader<string, (PageWithRevisions & {tags: TaggedPages[]}) | null>
  readonly publicPagesByID: DataLoader<string, PublicPage | null>
  readonly publicPagesBySlug: DataLoader<string, PublicPage | null>

  readonly events: DataLoader<string, Event | null>

  readonly userRolesByID: DataLoader<string, UserRole | null>

  readonly mailLogsByID: DataLoader<string, MailLog | null>

  readonly peer: DataLoader<string, Peer | null>
  readonly peerBySlug: DataLoader<string, Peer | null>

  readonly peerSchema: DataLoader<string, GraphQLSchema | null>
  readonly peerAdminSchema: DataLoader<string, GraphQLSchema | null>

  readonly memberPlansByID: DataLoader<string, MemberPlanWithPaymentMethods | null>
  readonly memberPlansBySlug: DataLoader<string, MemberPlanWithPaymentMethods | null>
  readonly activeMemberPlansByID: DataLoader<string, MemberPlanWithPaymentMethods | null>
  readonly activeMemberPlansBySlug: DataLoader<string, MemberPlanWithPaymentMethods | null>
  readonly paymentMethodsByID: DataLoader<string, PaymentMethod | null>
  readonly activePaymentMethodsByID: DataLoader<string, PaymentMethod | null>
  readonly activePaymentMethodsBySlug: DataLoader<string, PaymentMethod | null>
  readonly invoicesByID: DataLoader<string, InvoiceWithItems | null>
  readonly paymentsByID: DataLoader<string, Payment | null>

  readonly pollById: DataLoader<string, FullPoll | null>
  readonly eventById: DataLoader<string, Event | null>

  readonly commentsById: DataLoader<string, Comment | null>
  readonly commentRatingSystemAnswers: DataLoader<1, CommentRatingSystemAnswer[]>
  readonly subscriptionsById: DataLoader<string, SubscriptionWithRelations | null>
  readonly usersById: DataLoader<string, User | null>

  readonly blockStyleById: BlockStylesDataloaderService
}

export interface OAuth2Clients {
  name: string
  provider: Oauth2Provider
  client: Client
}

export interface Context {
  readonly hostURL: string
  readonly websiteURL: string
  readonly sessionTTL: number
  readonly hashCostFactor: number

  readonly session: AuthSession | null
  readonly loaders: DataLoaderContext

  readonly mailContext: MailContext
  readonly memberContext: MemberContext

  readonly prisma: PrismaClient
  readonly mediaAdapter: MediaAdapter
  readonly urlAdapter: URLAdapter
  readonly oauth2Providers: Oauth2Provider[]
  readonly paymentProviders: PaymentProvider[]
  readonly hooks?: Hooks
  readonly challenge: ChallengeProvider

  getOauth2Clients(): Promise<OAuth2Clients[]>

  authenticate(): AuthSession

  authenticateToken(): TokenSession

  authenticateUser(): UserSession

  optionalAuthenticateUser(): UserSession | null

  generateJWT(props: Pick<GenerateJWTProps, 'id' | 'audience' | 'expiresInMinutes'>): string

  verifyJWT(token: string): string

  createPaymentWithProvider(props: CreatePaymentWithProvider): Promise<Payment>
}

export interface Oauth2Provider {
  readonly name: string
  readonly discoverUrl: string
  readonly clientId: string
  readonly clientKey: string
  readonly scopes: string[]
  readonly redirectUri: string[]
}

interface PeerQueryParams {
  cacheKey: string
  readonly hostURL: string
  readonly variables: {[p: string]: any} | undefined
  readonly query: string
  readonly operationName: string | undefined
  readonly token: string
  readonly timeout: number
}

interface PeerCacheValue {
  queryParams: PeerQueryParams
  data: any
}

export interface ContextOptions {
  readonly hostURL: string
  readonly websiteURL: string
  readonly sessionTTL?: number
  readonly hashCostFactor?: number

  readonly prisma: PrismaClient
  readonly mediaAdapter: MediaAdapter
  readonly urlAdapter: URLAdapter
  readonly mailProvider: BaseMailProvider
  readonly mailContextOptions: MailContextOptions
  readonly oauth2Providers: Oauth2Provider[]
  readonly paymentProviders: PaymentProvider[]
  readonly hooks?: Hooks
  readonly challenge: ChallengeProvider
}

export interface SendMailFromProviderProps {
  recipient: string
  replyToAddress: string
  subject: string
  message?: string
  template?: string
  templateData?: Record<string, any>
}

export interface CreatePaymentWithProvider {
  paymentMethodID: string
  invoice: InvoiceWithItems
  saveCustomer: boolean
  successURL?: string
  failureURL?: string
  user?: User
}

export async function contextFromRequest(
  req: IncomingMessage | null,
  {
    hostURL,
    websiteURL,
    prisma,
    mediaAdapter,
    urlAdapter,
    oauth2Providers,
    hooks,
    mailProvider,
    mailContextOptions,
    paymentProviders,
    challenge,
    sessionTTL,
    hashCostFactor
  }: ContextOptions
): Promise<Context> {
  const authService = new AuthenticationService(prisma)

  const token = tokenFromRequest(req)
  const session = token ? await authService.getSessionByToken(token) : null
  const isSessionValid = authService.isSessionValid(session)

  const peerDataLoader = new DataLoader(async ids =>
    createOptionalsArray(
      ids as string[],
      await prisma.peer.findMany({
        where: {
          id: {
            in: ids as string[]
          }
        }
      }),
      'id'
    )
  )

  const loaders: DataLoaderContext = {
    navigationByID: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.navigation.findMany({
          where: {
            id: {
              in: ids as string[]
            }
          },
          include: {
            links: true
          }
        }),
        'id'
      )
    ),
    navigationByKey: new DataLoader(async keys =>
      createOptionalsArray(
        keys as string[],
        await prisma.navigation.findMany({
          where: {
            key: {
              in: keys as string[]
            }
          },
          include: {
            links: true
          }
        }),
        'key'
      )
    ),

    authorsByID: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.author.findMany({
          where: {
            id: {
              in: ids as string[]
            }
          },
          include: {
            links: true
          }
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
              in: slugs as string[]
            }
          },
          include: {
            links: true
          }
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
              in: ids as string[]
            }
          },
          include: {
            focalPoint: true
          }
        }),
        'id'
      )
    ),

    articles: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.article.findMany({
          where: {
            id: {
              in: ids as string[]
            }
          },
          include: {
            tags: true,
            draft: {
              include: {
                properties: true,
                authors: true,
                socialMediaAuthors: true
              }
            },
            pending: {
              include: {
                properties: true,
                authors: true,
                socialMediaAuthors: true
              }
            },
            published: {
              include: {
                properties: true,
                authors: true,
                socialMediaAuthors: true
              }
            }
          }
        }),
        'id'
      )
    ),
    publicArticles: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        (
          await prisma.article.findMany({
            where: {
              id: {
                in: ids as string[]
              },
              OR: [
                {
                  publishedId: {
                    not: null
                  }
                },
                {
                  pendingId: {
                    not: null
                  }
                }
              ]
            },
            include: {
              published: {
                include: {
                  properties: true,
                  authors: true,
                  socialMediaAuthors: true
                }
              },
              pending: {
                include: {
                  properties: true,
                  authors: true,
                  socialMediaAuthors: true
                }
              }
            }
          })
        ).map(articleWithRevisionsToPublicArticle),
        'id'
      )
    ),

    pages: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.page.findMany({
          where: {
            id: {
              in: ids as string[]
            }
          },
          include: {
            tags: true,
            draft: {
              include: {
                properties: true
              }
            },
            pending: {
              include: {
                properties: true
              }
            },
            published: {
              include: {
                properties: true
              }
            }
          }
        }),
        'id'
      )
    ),
    publicPagesByID: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        (
          await prisma.page.findMany({
            where: {
              id: {
                in: ids as string[]
              },
              OR: [
                {
                  published: {
                    isNot: null
                  }
                },
                {
                  pending: {
                    isNot: null
                  }
                }
              ]
            },
            include: {
              published: {
                include: {
                  properties: true
                }
              },
              pending: {
                include: {
                  properties: true
                }
              }
            }
          })
        ).map(pageWithRevisionsToPublicPage),
        'id'
      )
    ),
    publicPagesBySlug: new DataLoader(async slugs =>
      createOptionalsArray(
        slugs as string[],
        (
          await prisma.page.findMany({
            where: {
              OR: [
                {
                  published: {
                    is: {
                      slug: {
                        in: slugs as string[]
                      }
                    }
                  }
                },
                {
                  pending: {
                    is: {
                      slug: {
                        in: slugs as string[]
                      }
                    }
                  }
                }
              ]
            },
            include: {
              published: {
                include: {
                  properties: true
                }
              },
              pending: {
                include: {
                  properties: true
                }
              }
            }
          })
        ).map(pageWithRevisionsToPublicPage),
        'slug'
      )
    ),

    events: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.event.findMany({
          where: {
            id: {
              in: ids as string[]
            }
          }
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
              in: ids as string[]
            }
          }
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
              in: ids as string[]
            }
          }
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
              in: slugs as string[]
            }
          }
        }),
        'slug'
      )
    ),

    peerSchema: new DataLoader(async ids => {
      const peers = await peerDataLoader.loadMany(ids)

      return Promise.all(
        peers.map(async peer => {
          try {
            if (!peer) return null

            if (peer instanceof Error) {
              console.error(peer)
              return null
            }
            const peerTimeout =
              ((
                await prisma.setting.findUnique({
                  where: {name: SettingName.PEERING_TIMEOUT_MS}
                })
              )?.value as number) ||
              parseInt(process.env.PEERING_TIMEOUT_IN_MS as string) ||
              10 * 1000 // 10 Seconds timeout in  ms
            const fetcher = createFetcher(
              createSafeHostUrl(peer.hostURL, 'v1'),
              peer.token,
              peerTimeout
            )

            return wrapSchema({
              schema: await schemaFromExecutor(fetcher),
              executor: fetcher
            })
          } catch (err) {
            console.error(err)
            return null
          }
        })
      )
    }),

    peerAdminSchema: new DataLoader(async ids => {
      const peers = await peerDataLoader.loadMany(ids)

      return Promise.all(
        peers.map(async peer => {
          try {
            if (!peer) return null

            if (peer instanceof Error) {
              console.error(peer)
              return null
            }
            const peerTimeout =
              ((
                await prisma.setting.findUnique({
                  where: {name: SettingName.PEERING_TIMEOUT_MS}
                })
              )?.value as number) ||
              parseInt(process.env.PEERING_TIMEOUT_IN_MS as string) ||
              10 * 1000 // 10 Seconds timeout in  ms

            const fetcher = createFetcher(
              createSafeHostUrl(peer.hostURL, 'v1/admin'),
              peer.token,
              peerTimeout
            )

            return wrapSchema({
              schema: await schemaFromExecutor(fetcher),
              executor: fetcher
            })
          } catch (err) {
            console.error(err)
            return null
          }
        })
      )
    }),

    memberPlansByID: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.memberPlan.findMany({
          where: {
            id: {
              in: ids as string[]
            }
          },
          include: {
            availablePaymentMethods: true
          }
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
              in: slugs as string[]
            }
          },
          include: {
            availablePaymentMethods: true
          }
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
              in: ids as string[]
            },
            active: true
          },
          include: {
            availablePaymentMethods: true
          }
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
              in: slugs as string[]
            },
            active: true
          },
          include: {
            availablePaymentMethods: true
          }
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
              in: ids as string[]
            }
          }
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
              in: ids as string[]
            },
            active: true
          }
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
              in: slugs as string[]
            },
            active: true
          }
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
              in: ids as string[]
            }
          },
          include: {
            items: true
          }
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
              in: ids as string[]
            }
          }
        }),
        'id'
      )
    ),

    pollById: new DataLoader(async ids => Promise.all(ids.map(id => getPoll(id, prisma.poll)))),
    eventById: new DataLoader(async ids => Promise.all(ids.map(id => getEvent(id, prisma.event)))),

    commentsById: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.comment.findMany({
          where: {
            id: {in: ids as string[]}
          },
          include: {
            overriddenRatings: true,
            revisions: {orderBy: {createdAt: 'asc'}}
          }
        }),
        'id'
      )
    ),

    commentRatingSystemAnswers: new DataLoader(async () => [
      await prisma.commentRatingSystemAnswer.findMany()
    ]),

    subscriptionsById: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.subscription.findMany({
          where: {
            id: {
              in: ids as string[]
            }
          },
          include: {
            periods: true,
            properties: true,
            deactivation: true
          }
        }),
        'id'
      )
    ),

    usersById: new DataLoader(async ids =>
      createOptionalsArray(
        ids as string[],
        await prisma.user.findMany({
          where: {
            id: {in: ids as string[]}
          },
          include: {address: true}
        }),
        'id'
      )
    ),

    blockStyleById: new BlockStylesDataloaderService(prisma)
  }

  const mailContext = new MailContext({
    prisma,
    mailProvider,
    defaultFromAddress: mailContextOptions.defaultFromAddress,
    defaultReplyToAddress: mailContextOptions.defaultReplyToAddress
  })

  const generateJWTWrapper: Context['generateJWT'] = ({expiresInMinutes, audience, id}): string => {
    if (!process.env.JWT_SECRET_KEY) throw new Error('No JWT_SECRET_KEY defined in environment.')

    return generateJWT({
      id,
      secret: process.env.JWT_SECRET_KEY,
      issuer: hostURL,
      audience: audience ?? websiteURL,
      expiresInMinutes
    })
  }

  const verifyJWT = (token: string): string => {
    if (!process.env.JWT_SECRET_KEY) throw new Error('No JWT_SECRET_KEY defined in environment.')
    const ver = jwt.verify(token, process.env.JWT_SECRET_KEY)
    return typeof ver === 'object' && 'sub' in ver ? (ver as Record<string, any>).sub : ''
  }

  const memberContext = new MemberContext({
    loaders,
    prisma,
    paymentProviders,
    mailContext,
    getLoginUrlForUser(user: User): string {
      const jwt = generateJWTWrapper({
        id: user.id,
        expiresInMinutes: 10080 // One week in minutes
      })

      return urlAdapter.getLoginURL(jwt)
    }
  })

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
    oauth2Providers,
    paymentProviders,
    hooks,
    sessionTTL: sessionTTL ?? DefaultSessionTTL,
    hashCostFactor: hashCostFactor ?? DefaultBcryptHashCostFactor,

    async getOauth2Clients() {
      return await Promise.all(
        oauth2Providers.map(async provider => {
          const issuer = await Issuer.discover(provider.discoverUrl)
          return {
            name: provider.name,
            provider,
            client: new issuer.Client({
              client_id: provider.clientId,
              client_secret: provider.clientKey,
              redirect_uris: provider.redirectUri,
              response_types: ['code']
            })
          }
        })
      )
    },

    authenticateUser() {
      if (!session || session.type !== AuthSessionType.User) {
        throw new AuthenticationError('Invalid user session!')
      }

      if (!isSessionValid) {
        throw new TokenExpiredError()
      }

      return session
    },

    optionalAuthenticateUser() {
      if (!session || session.type !== AuthSessionType.User || !isSessionValid) {
        return null
      }
      return session
    },

    authenticateToken() {
      if (!session || session.type !== AuthSessionType.Token) {
        throw new AuthenticationError('Invalid token session!')
      }

      return session
    },

    authenticate() {
      if (!session) {
        throw new AuthenticationError('Invalid session!')
      }

      if (!isSessionValid) {
        throw new TokenExpiredError()
      }

      return session
    },

    generateJWT: generateJWTWrapper,

    verifyJWT,

    async createPaymentWithProvider({
      paymentMethodID,
      invoice,
      saveCustomer,
      failureURL,
      successURL,
      user
    }: CreatePaymentWithProvider): Promise<Payment> {
      const paymentMethod = await loaders.activePaymentMethodsByID.load(paymentMethodID)
      const paymentProvider = paymentProviders.find(
        pp => pp.id === paymentMethod?.paymentProviderID
      )

      if (!paymentProvider) {
        throw new Error('paymentProvider not found')
      }

      const payment = await prisma.payment.create({
        data: {
          paymentMethodID,
          invoiceID: invoice.id,
          state: PaymentState.created
        }
      })

      const customer = user
        ? await prisma.paymentProviderCustomer.findFirst({
            where: {
              userId: user.id,
              paymentProviderID: paymentMethod.paymentProviderID
            }
          })
        : null

      const intent = await paymentProvider.createIntent({
        paymentID: payment.id,
        invoice,
        saveCustomer,
        successURL,
        failureURL,
        customerID: customer?.customerID
      })

      const updatedPayment = await prisma.payment.update({
        where: {id: payment.id},
        data: {
          state: intent.state,
          intentID: `${intent.intentID}`,
          intentData: intent.intentData,
          intentSecret: intent.intentSecret,
          paymentData: intent.paymentData,
          paymentMethodID: payment.paymentMethodID,
          invoiceID: payment.invoiceID
        }
      })

      if (!updatedPayment) throw new Error('Error during updating payment') // TODO: this check needs to be removed

      // Mark invoice as paid
      if (intent.state === PaymentState.paid) {
        const intentState = await paymentProvider.checkIntentStatus({
          intentID: updatedPayment.intentID,
          paymentID: updatedPayment.id
        })
        await paymentProvider.updatePaymentWithIntentState({
          intentState,
          paymentClient: prisma.payment,
          paymentsByID: loaders.paymentsByID,
          invoicesByID: loaders.invoicesByID,
          subscriptionClient: prisma.subscription,
          userClient: prisma.user,
          invoiceClient: prisma.invoice,
          subscriptionPeriodClient: prisma.subscriptionPeriod,
          invoiceItemClient: prisma.invoiceItem
        })
      }
      return updatedPayment as Payment
    },
    challenge
  }
}

export function tokenFromRequest(req: IncomingMessage | null): string | null {
  if (req?.headers.authorization) {
    const [, token] = req.headers.authorization.match(/Bearer (.+?$)/i) || []
    return token || null
  }

  return null
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
  )
}

/**
 * Function that refreshes and initializes entries in the cache
 * @param params
 */

async function loadFreshData(params: PeerQueryParams) {
  try {
    const abortController = new AbortController()

    const peerTimeOut = params.timeout ? params.timeout : 10 * 1000 // 10 Seconds timeout in  ms

    // Since we use auto refresh cache we can safely set the timeout to 3sec
    setTimeout(() => abortController.abort(), peerTimeOut)

    const fetchResult = await fetch(params.hostURL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${params.token}`},
      body: JSON.stringify({
        query: params.query,
        variables: params.variables,
        operationName: params.operationName
      }),
      signal: abortController.signal
    })
    const res = await fetchResult.json()
    if (fetchResult?.status !== 200) {
      return {
        errors: [new GraphQLError(`Peer responded with invalid status: ${fetchResult?.status}`)]
      }
    }
    const cacheValue: PeerCacheValue = {
      data: res,
      queryParams: params
    }
    fetcherCache.set(params.cacheKey, cacheValue)
    return res
  } catch (err) {
    let errorMessage = err
    if ((err as any).type === 'aborted') {
      errorMessage = new Error(`Connection to peer (${params.hostURL}) timed out.`)
    }
    logger('context').error(`${errorMessage}`)
    return {errors: [err]}
  }
}

export function createFetcher(hostURL: string, token: string, peerTimeOut: number): Executor {
  const loadData = async ({
    query,
    variables,
    operationName
  }: {query: string} & Omit<ExecutionRequest, 'document' | 'context'>) => {
    // Initialize and prepare caching
    const fetchParams: PeerQueryParams = {
      hostURL,
      variables,
      query,
      operationName,
      token,
      cacheKey: '',
      timeout: peerTimeOut
    }

    fetchParams.cacheKey = generateCacheKey(fetchParams)
    const cachedData = fetcherCache.get<PeerCacheValue>(fetchParams.cacheKey)

    if (cachedData) {
      // Serve cached entries direct
      return cachedData.data
    }

    return await loadFreshData(fetchParams)
  }

  return async ({variables, operationName, document}) => {
    const query = print(document)

    return loadData({query, variables, operationName})
  }
}
