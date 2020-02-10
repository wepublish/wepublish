import DataLoader from 'dataloader'

import {IncomingMessage} from 'http'

import {TokenExpiredError} from './error'
import {Hooks} from './hooks'

import {DBAdapter} from './db/adapter'
import {SessionWithToken, OptionalSessionWithToken} from './db/session'

import {MediaAdapter} from './media/adapter'
import {AuthenticationError} from 'apollo-server'
import {OptionalImage} from './db/image'

export interface DataLoaderContext {
  readonly image: DataLoader<string, OptionalImage>
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
      image: new DataLoader(ids => {
        return dbAdapter.getImagesByID(ids)
      })
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
