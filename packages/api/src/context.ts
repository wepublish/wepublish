import DataLoader from 'dataloader'

import {IncomingMessage} from 'http'

import {TokenExpiredError} from './error'
import {Hooks} from './hooks'

import {PeerSession, UserSession, SessionType, OptionalSession} from './db/session'

import {DBAdapter} from './db/adapter'
import {MediaAdapter} from './mediaAdapter'
import {URLAdapter} from './urlAdapter'

import {AuthenticationError} from 'apollo-server-express'
import {OptionalImage} from './db/image'
import {OptionalArticle, OptionalPublicArticle} from './db/article'
import {OptionalAuthor} from './db/author'
import {OptionalNavigation} from './db/navigation'
import {OptionalPage, OptionalPublicPage} from './db/page'

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
}

export interface Context {
  readonly session: OptionalSession
  readonly loaders: DataLoaderContext

  readonly dbAdapter: DBAdapter
  readonly mediaAdapter: MediaAdapter
  readonly urlAdapter: URLAdapter

  readonly hooks?: Hooks

  authenticatePeer(): PeerSession
  authenticateUser(): UserSession
}

export interface ContextOptions {
  readonly dbAdapter: DBAdapter
  readonly mediaAdapter: MediaAdapter
  readonly urlAdapter: URLAdapter
  readonly hooks?: Hooks
}

export async function contextFromRequest(
  req: IncomingMessage,
  {dbAdapter, mediaAdapter, urlAdapter, hooks}: ContextOptions
): Promise<Context> {
  const token = tokenFromRequest(req)
  const session = token ? await dbAdapter.getSessionByToken(token) : null
  const isSessionValid = session
    ? session.type === SessionType.User
      ? session.expiresAt > new Date()
      : true
    : false

  return {
    session: isSessionValid ? session : null,
    loaders: {
      navigationByID: new DataLoader(ids => dbAdapter.getNavigationsByID(ids)),
      navigationByKey: new DataLoader(keys => dbAdapter.getNavigationsByKey(keys)),

      authorsByID: new DataLoader(ids => dbAdapter.getAuthorsByID(ids)),
      authorsBySlug: new DataLoader(slugs => dbAdapter.getAuthorsBySlug(slugs)),

      images: new DataLoader(ids => dbAdapter.getImagesByID(ids)),

      articles: new DataLoader(ids => dbAdapter.getArticlesByID(ids)),
      publicArticles: new DataLoader(ids => dbAdapter.getPublishedArticlesByID(ids)),

      pages: new DataLoader(ids => dbAdapter.getPagesByID(ids)),
      publicPagesByID: new DataLoader(ids => dbAdapter.getPublishedPagesByID(ids)),
      publicPagesBySlug: new DataLoader(slugs => dbAdapter.getPublishedPagesBySlug(slugs))
    },

    dbAdapter,
    mediaAdapter,
    urlAdapter,
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

    authenticatePeer() {
      if (!session || session.type !== SessionType.Peer) {
        throw new AuthenticationError('Invalid peer session!')
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
