import {IncomingMessage} from 'http'
import url from 'url'
import crypto from 'crypto'

import fetch from 'node-fetch'
import AbortController from 'abort-controller'

import DataLoader from 'dataloader'

import {GraphQLSchema, print, GraphQLError} from 'graphql'

import {
  makeRemoteExecutableSchema,
  introspectSchema,
  Fetcher,
  IFetcherOperation
} from 'graphql-tools'

import {TokenExpiredError} from './error'
import {Hooks} from './hooks'

import {TokenSession, UserSession, SessionType, OptionalSession, Session} from './db/session'

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

  readonly peer: DataLoader<string, OptionalPeer>
  readonly peerBySlug: DataLoader<string, OptionalPeer>

  readonly peerSchema: DataLoader<string, GraphQLSchema | null>
  readonly peerAdminSchema: DataLoader<string, GraphQLSchema | null>
}

export interface Context {
  readonly hostURL: string
  readonly websiteURL: string

  readonly session: OptionalSession
  readonly loaders: DataLoaderContext

  readonly dbAdapter: DBAdapter
  readonly mediaAdapter: MediaAdapter
  readonly urlAdapter: URLAdapter
  readonly oauth2Providers: Oauth2Provider[]
  readonly hooks?: Hooks

  authenticate(): Session
  authenticateToken(): TokenSession
  authenticateUser(): UserSession
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
  readonly oauth2Providers: Oauth2Provider[]
  readonly hooks?: Hooks
}

export async function contextFromRequest(
  req: IncomingMessage,
  {hostURL, websiteURL, dbAdapter, mediaAdapter, urlAdapter, oauth2Providers, hooks}: ContextOptions
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

  return {
    hostURL,
    websiteURL,
    session: isSessionValid ? session : null,
    loaders: {
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
      })
    },

    dbAdapter,
    mediaAdapter,
    urlAdapter,
    oauth2Providers,
    hooks,

    authenticateUser() {
      if (!session || session.type !== SessionType.User) {
        throw new AuthenticationError('Invalid user session!')
      }

      if (!isSessionValid) {
        throw new TokenExpiredError()
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
    }
  }
}

export function tokenFromRequest(req: IncomingMessage): string | null {
  if (req.headers.authorization) {
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
