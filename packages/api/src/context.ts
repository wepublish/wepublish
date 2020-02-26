import DataLoader from 'dataloader'

import {IncomingMessage} from 'http'

import {TokenExpiredError} from './error'
import {Hooks} from './hooks'

import {DBAdapter} from './db/adapter'
import {SessionWithToken, OptionalSessionWithToken} from './db/session'

import {MediaAdapter} from './media/adapter'
import {AuthenticationError} from 'apollo-server'
import {OptionalImage} from './db/image'
import {OptionalArticle, OptionalPublishedArticle} from './db/article'

export interface DataLoaderContext {
  readonly articles: DataLoader<string, OptionalArticle>
  readonly publishedArticles: DataLoader<string, OptionalPublishedArticle>
  readonly images: DataLoader<string, OptionalImage>
  readonly authors: DataLoader<string, any>
}

export interface Context {
  readonly session: OptionalSessionWithToken
  readonly loaders: DataLoaderContext

  readonly dbAdapter: DBAdapter
  readonly mediaAdapter: MediaAdapter

  readonly hooks?: Hooks

  authenticate(): SessionWithToken

  readonly storageAdapter: any // TEMP: Remove me
}

export interface ContextOptions {
  readonly dbAdapter: DBAdapter
  readonly mediaAdapter: MediaAdapter
  readonly hooks?: Hooks
}

export async function contextFromRequest(
  req: IncomingMessage,
  {dbAdapter, mediaAdapter, hooks}: ContextOptions
): Promise<Context> {
  const token = tokenFromRequest(req)
  const session = token ? await dbAdapter.getSessionByToken(token) : null
  const isSessionValid = session && session.expiresAt > new Date()

  return {
    session: isSessionValid ? session : null,
    loaders: {
      articles: new DataLoader(ids => dbAdapter.getArticlesByID(ids)),
      publishedArticles: new DataLoader(ids => dbAdapter.getPublishedArticlesByID(ids)),
      images: new DataLoader(ids => dbAdapter.getImagesByID(ids)),
      authors: new DataLoader(ids => dbAdapter.getAuthorsByID(ids))
    },

    dbAdapter,
    mediaAdapter,
    hooks,

    authenticate() {
      if (!session) {
        throw new AuthenticationError('Invalid session!')
      }

      if (!isSessionValid) {
        throw new TokenExpiredError()
      }

      return session
    },

    storageAdapter: null // TEMP: Remove me
  }
}

export function tokenFromRequest(req: IncomingMessage): string | null {
  if (req.headers.authorization) {
    const [, token] = req.headers.authorization.match(/Bearer (.+?$)/i) || []
    return token || null
  }

  return null
}
