import {
  Author,
  Image,
  MailLog,
  Payment,
  PaymentMethod,
  PaymentState,
  Peer,
  PrismaClient,
  User,
  UserRole
} from '@prisma/client'
import AbortController from 'abort-controller'
import {AuthenticationError} from 'apollo-server-express'
import crypto from 'crypto'
import DataLoader from 'dataloader'
import {GraphQLError, GraphQLSchema, print} from 'graphql'
import {
  Fetcher,
  IFetcherOperation,
  introspectSchema,
  makeRemoteExecutableSchema
} from 'graphql-tools'
import {IncomingMessage} from 'http'
import jwt, {SignOptions} from 'jsonwebtoken'
import NodeCache from 'node-cache'
import fetch from 'node-fetch'
import {Client, Issuer} from 'openid-client'
import url from 'url'
import {ChallengeProvider} from './challenges/challengeProvider'
import {
  ArticleWithRevisions,
  articleWithRevisionsToPublicArticle,
  PublicArticle
} from './db/article'
import {DefaultBcryptHashCostFactor, DefaultSessionTTL} from './db/common'
import {InvoiceWithItems} from './db/invoice'
import {MemberPlanWithPaymentMethods} from './db/memberPlan'
import {NavigationWithLinks} from './db/navigation'
import {PageWithRevisions, pageWithRevisionsToPublicPage, PublicPage} from './db/page'
import {Session, SessionType, TokenSession, UserSession} from './db/session'
import {SettingName} from './db/setting'
import {unselectPassword} from './db/user'
import {TokenExpiredError} from './error'
import {FullPoll, getPoll} from './graphql/poll/poll.public-queries'
import {Hooks} from './hooks'
import {MailContext, MailContextOptions} from './mails/mailContext'
import {BaseMailProvider} from './mails/mailProvider'
import {MediaAdapter} from './media/mediaAdapter'
import {MemberContext} from './memberContext'
import {PaymentProvider} from './payments/paymentProvider'
import {logger} from './server'
import {URLAdapter} from './urlAdapter'

/**
 * Peered article cache configuration and setup
 */
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000
const fetcherCache = new NodeCache({
  stdTTL: 1800,
  checkperiod: 60,
  deleteOnExpire: false,
  useClones: false
})
fetcherCache.on('expired', async function (key: string, value: PeerCacheValue) {
  // Refresh cache only if last use of cached entry is less than 24h ago
  if (value.queryParams.lastQueried > new Date().getTime() - ONE_DAY_IN_MS) {
    await loadFreshData(value.queryParams)
  } else {
    fetcherCache.del(key)
  }
})

export interface DataLoaderContext {
  readonly navigationByID: DataLoader<string, NavigationWithLinks | null>
  readonly navigationByKey: DataLoader<string, NavigationWithLinks | null>

  readonly authorsByID: DataLoader<string, Author | null>
  readonly authorsBySlug: DataLoader<string, Author | null>

  readonly images: DataLoader<string, Image | null>

  readonly articles: DataLoader<string, ArticleWithRevisions | null>
  readonly publicArticles: DataLoader<string, PublicArticle | null>

  readonly pages: DataLoader<string, PageWithRevisions | null>
  readonly publicPagesByID: DataLoader<string, PublicPage | null>
  readonly publicPagesBySlug: DataLoader<string, PublicPage | null>

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

  readonly session: Session | null
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

  authenticate(): Session
  authenticateToken(): TokenSession
  authenticateUser(): UserSession
  optionalAuthenticateUser(): UserSession | null

  generateJWT(props: GenerateJWTProps): string
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
  lastQueried: number
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
  readonly mailProvider?: BaseMailProvider
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
}

export interface GenerateJWTProps {
  id: string
  audience?: string
  expiresInMinutes?: number
}

const createOptionalsArray = <Data, Attribute extends keyof Data, Key extends Data[Attribute]>(
  keys: Key[],
  data: Data[],
  attribute: Attribute
): Array<Data | null> => {
  const dataMap = Object.fromEntries(data.map(entry => [entry[attribute], entry]))

  return keys.map(id => dataMap[id] ?? null)
}

const getSessionByToken = async (
  token: string,
  sessionClient: PrismaClient['session'],
  tokenClient: PrismaClient['token'],
  userClient: PrismaClient['user'],
  userRoleClient: PrismaClient['userRole']
): Promise<Session | null> => {
  const [tokenMatch, session] = await Promise.all([
    tokenClient.findFirst({
      where: {
        token
      }
    }),
    sessionClient.findFirst({
      where: {
        token
      }
    })
  ])

  if (tokenMatch) {
    return {
      type: SessionType.Token,
      id: tokenMatch.id,
      name: tokenMatch.name,
      token: tokenMatch.token,
      roles: await userRoleClient.findMany({
        where: {
          id: {
            in: tokenMatch.roleIDs
          }
        }
      })
    }
  } else if (session) {
    const user = await userClient.findUnique({
      where: {
        id: session.userID
      },
      select: unselectPassword
    })

    if (!user) return null

    return {
      type: SessionType.User,
      id: session.id,
      token: session.token,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      user,
      roles: await userRoleClient.findMany({
        where: {
          id: {
            in: user.roleIDs
          }
        }
      })
    }
  }

  return null
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
  const token = tokenFromRequest(req)
  const session = token
    ? await getSessionByToken(token, prisma.session, prisma.token, prisma.user, prisma.userRole)
    : null
  const isSessionValid = session
    ? session.type === SessionType.User
      ? session.expiresAt! > new Date()
      : true
    : false

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
            id: {
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
              3000
            const fetcher = createFetcher(peer.hostURL, peer.token, peerTimeout)

            return makeRemoteExecutableSchema({
              schema: await introspectSchema(fetcher),
              fetcher
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
              3000
            const fetcher = createFetcher(
              url.resolve(peer.hostURL, 'admin'),
              peer.token,
              peerTimeout
            )

            return makeRemoteExecutableSchema({
              schema: await introspectSchema(fetcher),
              fetcher
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

    pollById: new DataLoader(async ids => Promise.all(ids.map(id => getPoll(id, prisma.poll))))
  }

  const mailContext = new MailContext({
    prisma,
    mailProvider,
    defaultFromAddress: mailContextOptions.defaultFromAddress,
    defaultReplyToAddress: mailContextOptions.defaultReplyToAddress,
    mailTemplateMaps: mailContextOptions.mailTemplateMaps,
    mailTemplatesPath: mailContextOptions.mailTemplatesPath
  })

  const generateJWT = (props: GenerateJWTProps): string => {
    if (!process.env.JWT_SECRET_KEY) throw new Error('No JWT_SECRET_KEY defined in environment.')
    const jwtOptions: SignOptions = {
      issuer: hostURL,
      audience: props.audience ?? websiteURL,
      algorithm: 'HS256',
      expiresIn: `${props.expiresInMinutes || 15}m`
    }
    return jwt.sign({sub: props.id}, process.env.JWT_SECRET_KEY, jwtOptions)
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
      const jwt = generateJWT({
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
      if (!session || session.type !== SessionType.User) {
        throw new AuthenticationError('Invalid user session!')
      }

      if (!isSessionValid) {
        throw new TokenExpiredError()
      }

      return session
    },

    optionalAuthenticateUser() {
      if (!session || session.type !== SessionType.User || !isSessionValid) {
        return null
      }
      return session
    },

    authenticateToken() {
      if (!session || session.type !== SessionType.Token) {
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

    generateJWT,

    verifyJWT,

    async createPaymentWithProvider({
      paymentMethodID,
      invoice,
      saveCustomer,
      failureURL,
      successURL
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

      const intent = await paymentProvider.createIntent({
        paymentID: payment.id,
        invoice,
        saveCustomer,
        successURL,
        failureURL
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

    const peerTimeOUT = params.timeout ? params.timeout : 3000

    // Since we use auto refresh cache we can safely set the timeout to 3sec
    setTimeout(() => abortController.abort(), peerTimeOUT)

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
    params.lastQueried = params.lastQueried ? params.lastQueried : new Date().getTime()
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

export function createFetcher(hostURL: string, token: string, peerTimeOut: number): Fetcher {
  const data = new DataLoader<
    {query: string} & Omit<IFetcherOperation, 'query' | 'context'>,
    any,
    string
  >(async queries => {
    const results = await Promise.all(
      queries.map(async ({query, variables, operationName}) => {
        // Initialize and prepare caching
        const fetchParams: PeerQueryParams = {
          hostURL,
          variables,
          query,
          operationName,
          token,
          cacheKey: '',
          lastQueried: 0,
          timeout: peerTimeOut
        }
        fetchParams.cacheKey = generateCacheKey(fetchParams)
        const cachedData: PeerCacheValue | undefined = fetcherCache.get(fetchParams.cacheKey)

        // On initial query add data to cache queue
        if (!cachedData) {
          return await loadFreshData(fetchParams)
        }

        // Serve cached entries direct
        cachedData.queryParams.lastQueried = new Date().getTime()
        return cachedData.data
      })
    )

    return results
  })

  return async ({query: queryDocument, variables, operationName}) => {
    const query = print(queryDocument)
    return data.load({query, variables, operationName})
  }
}
