import {IncomingMessage} from 'http'
import url from 'url'
import crypto from 'crypto'
import jwt, {SignOptions} from 'jsonwebtoken'
import fetch from 'node-fetch'
import AbortController from 'abort-controller'

import DataLoader from 'dataloader'

import {GraphQLError, GraphQLSchema, print} from 'graphql'

import {
  Fetcher,
  IFetcherOperation,
  introspectSchema,
  makeRemoteExecutableSchema
} from 'graphql-tools'

import {TokenExpiredError} from './error'
import {Hooks} from './hooks'

import {OptionalSession, Session, SessionType, TokenSession, UserSession} from './db/session'

import {DBAdapter} from './db/adapter'
import {MediaAdapter} from './mediaAdapter'
import {URLAdapter} from './urlAdapter'

import {AuthenticationError} from 'apollo-server-express'
import {OptionalImage} from './db/image'
import {OptionalArticle, OptionalPublicArticle} from './db/article'
import {OptionalAuthor} from './db/author'
import {OptionalNavigation} from './db/navigation'
import {OptionalPage, OptionalPublicPage} from './db/page'

import {OptionalPeer} from './db/peer'
import {OptionalUserRole} from './db/userRole'
import {OptionalMemberPlan} from './db/memberPlan'
import {OptionalPaymentMethod} from './db/paymentMethod'
import {Invoice, OptionalInvoice} from './db/invoice'
import {OptionalPayment, Payment, PaymentState} from './db/payment'
import {PaymentProvider} from './payments/paymentProvider'
import {BaseMailProvider} from './mails/mailProvider'
import {OptionalMailLog} from './db/mailLog'
import {MemberContext} from './memberContext'
import {Client, Issuer} from 'openid-client'
import {MailContext, MailContextOptions} from './mails/mailContext'
import {User} from './db/user'
import {ChallengeProvider} from './challenges/challengeProvider'

export interface DataLoaderContext {
  readonly navigationByID: DataLoader<string, OptionalNavigation>
  readonly navigationByKey: DataLoader<string, OptionalNavigation>

  readonly authorsByID: DataLoader<string, OptionalAuthor>
  readonly authorsBySlug: DataLoader<string, OptionalAuthor>

  readonly images: DataLoader<string, OptionalImage>

  readonly articles: DataLoader<string, OptionalArticle>
  readonly publicArticles: DataLoader<string, OptionalPublicArticle>

  readonly pages: DataLoader<string, OptionalPage>
  readonly publicPagesByID: DataLoader<string, OptionalPublicPage>
  readonly publicPagesBySlug: DataLoader<string, OptionalPublicPage>

  readonly userRolesByID: DataLoader<string, OptionalUserRole>

  readonly mailLogsByID: DataLoader<string, OptionalMailLog>

  readonly peer: DataLoader<string, OptionalPeer>
  readonly peerBySlug: DataLoader<string, OptionalPeer>

  readonly peerSchema: DataLoader<string, GraphQLSchema | null>
  readonly peerAdminSchema: DataLoader<string, GraphQLSchema | null>

  readonly memberPlansByID: DataLoader<string, OptionalMemberPlan>
  readonly memberPlansBySlug: DataLoader<string, OptionalMemberPlan>
  readonly activeMemberPlansByID: DataLoader<string, OptionalMemberPlan>
  readonly activeMemberPlansBySlug: DataLoader<string, OptionalMemberPlan>
  readonly paymentMethodsByID: DataLoader<string, OptionalPaymentMethod>
  readonly activePaymentMethodsByID: DataLoader<string, OptionalPaymentMethod>
  readonly activePaymentMethodsBySlug: DataLoader<string, OptionalPaymentMethod>
  readonly invoicesByID: DataLoader<string, OptionalInvoice>
  readonly paymentsByID: DataLoader<string, OptionalPayment>
}

export interface OAuth2Clients {
  name: string
  provider: Oauth2Provider
  client: Client
}

export interface Context {
  readonly hostURL: string
  readonly websiteURL: string

  readonly session: OptionalSession
  readonly loaders: DataLoaderContext

  readonly mailContext: MailContext
  readonly memberContext: MemberContext

  readonly dbAdapter: DBAdapter
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

export interface ContextOptions {
  readonly hostURL: string
  readonly websiteURL: string

  readonly dbAdapter: DBAdapter
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
  invoice: Invoice
  saveCustomer: boolean
  successURL?: string
  failureURL?: string
}

export interface GenerateJWTProps {
  id: string
  audience?: string
  expiresInMinutes?: number
}

export async function contextFromRequest(
  req: IncomingMessage | null,
  {
    hostURL,
    websiteURL,
    dbAdapter,
    mediaAdapter,
    urlAdapter,
    oauth2Providers,
    hooks,
    mailProvider,
    mailContextOptions,
    paymentProviders,
    challenge
  }: ContextOptions
): Promise<Context> {
  const token = tokenFromRequest(req)
  const session = token ? await dbAdapter.session.getSessionByToken(token) : null
  const isSessionValid = session
    ? session.type === SessionType.User
      ? session.expiresAt > new Date()
      : true
    : false

  const peerDataLoader = new DataLoader<string, OptionalPeer>(async ids =>
    dbAdapter.peer.getPeersByID(ids)
  )

  const loaders: DataLoaderContext = {
    navigationByID: new DataLoader(ids => dbAdapter.navigation.getNavigationsByID(ids)),
    navigationByKey: new DataLoader(keys => dbAdapter.navigation.getNavigationsByKey(keys)),

    authorsByID: new DataLoader(ids => dbAdapter.author.getAuthorsByID(ids)),
    authorsBySlug: new DataLoader(slugs => dbAdapter.author.getAuthorsBySlug(slugs)),

    images: new DataLoader(ids => dbAdapter.image.getImagesByID(ids)),

    articles: new DataLoader(ids => dbAdapter.article.getArticlesByID(ids)),
    publicArticles: new DataLoader(ids => dbAdapter.article.getPublishedArticlesByID(ids)),

    pages: new DataLoader(ids => dbAdapter.page.getPagesByID(ids)),
    publicPagesByID: new DataLoader(ids => dbAdapter.page.getPublishedPagesByID(ids)),
    publicPagesBySlug: new DataLoader(slugs => dbAdapter.page.getPublishedPagesBySlug(slugs)),

    userRolesByID: new DataLoader(ids => dbAdapter.userRole.getUserRolesByID(ids)),

    mailLogsByID: new DataLoader(ids => dbAdapter.mailLog.getMailLogsByID(ids)),

    peer: peerDataLoader,
    peerBySlug: new DataLoader<string, OptionalPeer>(async slugs =>
      dbAdapter.peer.getPeersBySlug(slugs)
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

            const fetcher = createFetcher(peer.hostURL, peer.token)

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

            const fetcher = createFetcher(url.resolve(peer.hostURL, 'admin'), peer.token)

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

    memberPlansByID: new DataLoader(ids => dbAdapter.memberPlan.getMemberPlansByID(ids)),
    memberPlansBySlug: new DataLoader(slugs => dbAdapter.memberPlan.getMemberPlansBySlug(slugs)),
    activeMemberPlansByID: new DataLoader(ids =>
      dbAdapter.memberPlan.getActiveMemberPlansByID(ids)
    ),
    activeMemberPlansBySlug: new DataLoader(slugs =>
      dbAdapter.memberPlan.getActiveMemberPlansBySlug(slugs)
    ),
    paymentMethodsByID: new DataLoader(ids => dbAdapter.paymentMethod.getPaymentMethodsByID(ids)),
    activePaymentMethodsByID: new DataLoader(ids =>
      dbAdapter.paymentMethod.getActivePaymentMethodsByID(ids)
    ),
    activePaymentMethodsBySlug: new DataLoader(slugs =>
      dbAdapter.paymentMethod.getActivePaymentMethodsBySlug(slugs)
    ),
    invoicesByID: new DataLoader(ids => dbAdapter.invoice.getInvoicesByID(ids)),
    paymentsByID: new DataLoader(ids => dbAdapter.payment.getPaymentsByID(ids))
  }

  const mailContext = new MailContext({
    dbAdapter,
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
    dbAdapter,
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

    memberContext,
    mailContext,
    dbAdapter,
    mediaAdapter,
    urlAdapter,
    oauth2Providers,
    paymentProviders,
    hooks,

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

      const payment = await dbAdapter.payment.createPayment({
        input: {
          paymentMethodID,
          invoiceID: invoice.id,
          state: PaymentState.Created
        }
      })

      const intent = await paymentProvider.createIntent({
        paymentID: payment.id,
        invoice,
        saveCustomer,
        successURL,
        failureURL
      })

      const updatedPayment = await dbAdapter.payment.updatePayment({
        id: payment.id,
        input: {
          state: intent.state,
          intentID: intent.intentID,
          intentData: intent.intentData,
          intentSecret: intent.intentSecret,
          paymentData: intent.paymentData,
          paymentMethodID: payment.paymentMethodID,
          invoiceID: payment.invoiceID
        }
      })

      if (!updatedPayment) throw new Error('Error during updating payment') // TODO: this check needs to be removed

      return updatedPayment
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

export function createFetcher(hostURL: string, token: string): Fetcher {
  // TODO: Implement batching and improve caching.
  const cache = new DataLoader<
    {query: string} & Omit<IFetcherOperation, 'query' | 'context'>,
    any,
    string
  >(
    async queries => {
      const results = await Promise.all(
        queries.map(async ({query, variables, operationName}) => {
          try {
            const abortController = new AbortController()

            // TODO: Make timeout configurable.
            setTimeout(() => abortController.abort(), 1000)

            const fetchResult = await fetch(hostURL, {
              method: 'POST',
              headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
              body: JSON.stringify({query, variables, operationName}),
              signal: abortController.signal
            })

            if (fetchResult?.status != 200) {
              return {
                errors: [
                  new GraphQLError(`Peer responded with invalid status: ${fetchResult?.status}`)
                ]
              }
            }
            return await fetchResult.json()
          } catch (err) {
            if (err.type === 'aborted') {
              err = new Error(`Connection to peer (${hostURL}) timed out.`)
            }

            console.error(err)
            return {errors: [err]}
          }
        })
      )

      return results
    },
    {
      cacheKeyFn: ({query, variables, operationName}) =>
        // TODO: Use faster hashing function, doesn't have to be crypto safe.
        crypto
          .createHash('sha1')
          .update(`${query}.${JSON.stringify(variables)}.${operationName}`)
          .digest('base64')
    }
  )

  return async ({query: queryDocument, variables, operationName}) => {
    const query = print(queryDocument)
    return cache.load({query, variables, operationName})
  }
}
