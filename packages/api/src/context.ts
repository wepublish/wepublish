import DataLoader from 'dataloader'

import {IncomingMessage} from 'http'

import {TokenExpiredError} from './error'
import {Hooks} from './hooks'

import {DBAdapter} from './db/adapter'
import {OptionalSession} from './db/session'

import {MediaAdapter} from './media/adapter'
import {AuthenticationError} from 'apollo-server'
import {OptionalImage} from './db/image'

export interface DataLoaderContext {
  readonly image: DataLoader<string, OptionalImage>
}

export interface Context {
  readonly session: OptionalSession
  readonly loaders: DataLoaderContext

  readonly dbAdapter: DBAdapter
  readonly mediaAdapter: MediaAdapter

  readonly hooks?: Hooks

  readonly storageAdapter: any // TEMP: Remove me
  authenticate(): void // TEMP: Remvoe me
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

  if (token && !session) {
    throw new AuthenticationError('Invalid session token!')
  }

  if (session && session.expiryDate < new Date()) {
    throw new TokenExpiredError()
  }

  return {
    session,
    loaders: {
      image: new DataLoader(ids => {
        return dbAdapter.getImagesByID(ids)
      })
    },

    dbAdapter,
    mediaAdapter,
    hooks,

    storageAdapter: null, // TEMP: Remove me
    authenticate() {} // TEMP: Remove me
  }
}

export function tokenFromRequest(req: IncomingMessage): string | null {
  if (req.headers.authorization) {
    const [, token] = req.headers.authorization.match(/Bearer (.+?$)/i) || []
    return token || null
  }

  return null
}
