import ms from 'ms'
import {IncomingMessage} from 'http'

import {Adapter, AdapterUser} from './adapter'
import {InvalidTokenError} from './error'

export interface ContextRequest extends IncomingMessage {
  adapter: Adapter
}

export interface Context {
  adapter: Adapter
  sessionExpiry: number
  authenticate(): Promise<AdapterUser>
}

export interface ContextOptions {
  adapter: Adapter
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
  {adapter, sessionExpiry = '1w'}: ContextOptions
): Promise<Context> {
  return {
    adapter,
    sessionExpiry: typeof sessionExpiry === 'string' ? ms(sessionExpiry) : sessionExpiry,
    async authenticate() {
      const token = tokenFromRequest(req)
      if (!token) throw new InvalidTokenError()

      return await adapter.getSessionUser(token)
    }
  }
}
