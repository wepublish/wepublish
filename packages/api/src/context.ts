import ms from 'ms'
import {IncomingMessage} from 'http'

import {Adapter, AdapterUser} from './adapter'
import {TokenExpiredError} from './error'
import {AuthenticationError} from 'apollo-server'

export interface ContextRequest extends IncomingMessage {
  adapter: Adapter
}

export interface Context {
  adapter: Adapter
  sessionExpiry: number
  mediaServerURL: URL
  mediaServerToken: string
  authenticate(): Promise<AdapterUser>
}

export interface ContextOptions {
  adapter: Adapter
  mediaServerURL: string
  mediaServerToken: string
  sessionExpiry?: number | string
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
  {adapter, mediaServerURL, mediaServerToken, sessionExpiry = '1w'}: ContextOptions
): Promise<Context> {
  return {
    adapter,
    mediaServerURL: new URL(mediaServerURL),
    mediaServerToken,
    sessionExpiry: typeof sessionExpiry === 'string' ? ms(sessionExpiry) : sessionExpiry,
    async authenticate() {
      const token = tokenFromRequest(req)

      if (!token) throw new AuthenticationError('Missing token')

      const session = await adapter.getSession(token)

      if (!session) throw new AuthenticationError('Invalid token')

      const {user, expiryDate} = session

      if (new Date() >= expiryDate) throw new TokenExpiredError()

      return user
    }
  }
}
