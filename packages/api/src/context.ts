import DataLoader from 'dataloader'

import {IncomingMessage} from 'http'

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

  readonly peer: DataLoader<string, OptionalPeer>
}

export interface Context {
  readonly hostURL: string

  readonly session: OptionalSession
  readonly loaders: DataLoaderContext

  readonly dbAdapter: DBAdapter
  readonly mediaAdapter: MediaAdapter
  readonly urlAdapter: URLAdapter
  readonly oauth2Providers: Oauth2Provider[]
  readonly hooks?: Hooks

  authenticateToken(): TokenSession
  authenticateUser(): UserSession
  authenticateTokenOrUser(): Session
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
  readonly dbAdapter: DBAdapter
  readonly mediaAdapter: MediaAdapter
  readonly urlAdapter: URLAdapter
  readonly oauth2Providers: Oauth2Provider[]
  readonly hooks?: Hooks
}

export async function contextFromRequest(
  req: IncomingMessage,
  {hostURL, dbAdapter, mediaAdapter, urlAdapter, oauth2Providers, hooks}: ContextOptions
): Promise<Context> {
  const token = tokenFromRequest(req)
  const session = token ? await dbAdapter.session.getSessionByToken(token) : null
  const isSessionValid = session
    ? session.type === SessionType.User
      ? session.expiresAt > new Date()
      : true
    : false

  return {
    hostURL,
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

      peer: new DataLoader(async ids => dbAdapter.peer.getPeersByID(ids))
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

    authenticateTokenOrUser() {
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
