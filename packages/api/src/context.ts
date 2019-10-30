import ms from 'ms'
import {IncomingMessage} from 'http'
import {AuthenticationError} from 'apollo-server'

import {User} from './adapter/user'
import {StorageAdapter} from './adapter/storageAdapter'
import {MediaAdapter} from './adapter/mediaAdapter'

import {TokenExpiredError} from './error'

export interface Context {
  readonly storageAdapter: StorageAdapter
  readonly mediaAdapter: MediaAdapter
  readonly sessionExpiry: number

  authenticate(): Promise<User>
}

export interface ContextOptions {
  readonly storageAdapter: StorageAdapter
  readonly mediaAdapter: MediaAdapter
  readonly sessionExpiry?: number | string
}

export function tokenFromRequest(req: IncomingMessage) {
  if (req.headers.authorization) {
    const [, token] = req.headers.authorization.match(/Bearer (.+?$)/i) || []
    return token || null
  }

  return null
}

export async function contextFromRequest(
  req: IncomingMessage,
  {storageAdapter, mediaAdapter, sessionExpiry = '1w'}: ContextOptions
): Promise<Context> {
  return {
    storageAdapter,
    mediaAdapter,
    sessionExpiry: typeof sessionExpiry === 'string' ? ms(sessionExpiry) : sessionExpiry,

    async authenticate() {
      const token = tokenFromRequest(req)
      if (!token) throw new AuthenticationError('Missing token')

      const session = await storageAdapter.getSession(token)
      if (!session) throw new AuthenticationError('Invalid token')

      const {user, expiryDate} = session
      if (new Date() >= expiryDate) throw new TokenExpiredError()

      return user
    }
  }
}
