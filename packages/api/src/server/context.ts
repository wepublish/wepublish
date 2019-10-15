import {IncomingMessage} from 'http'
import {verify as verifyJWT} from 'jsonwebtoken'

import {parse as parseQueryString} from 'querystring'
import {Adapter, AdapterUser} from './adapter'

export interface ContextRequest extends IncomingMessage {
  adapter: Adapter
}

export interface Context {
  adapter: Adapter
  tokenSecret: string
  refreshTokenExpiresIn: number
  accessTokenExpiresIn: number
  token: string | null
  user: AdapterUser | null
}

export interface ContextOptions {
  adapter: Adapter
  tokenSecret: string
  refreshTokenExpiresIn: number
  accessTokenExpiresIn: number
}

export function tokenFromRequest(req: IncomingMessage) {
  if (req.headers.authorization) {
    return req.headers.authorization?.match(/Bearer (.+?$)/i)?.[1] ?? null
  } else if (req.url) {
    const token = parseQueryString(req.url.split('?')[1])['token']
    return typeof token === 'string' ? token : null
  }

  return null
}

export async function contextFromRequest(req: IncomingMessage, {adapter, tokenSecret, refreshTokenExpiresIn, accessTokenExpiresIn}: ContextOptions): Promise<Context> {
  const token = tokenFromRequest(req)
  const test = token ? verifyJWT(token, 'secret', {}) : null // TODO: Secret configurable

  console.log(test)

  return {
    adapter,
    token,
    tokenSecret,
    refreshTokenExpiresIn,
    accessTokenExpiresIn,
    user: {} as any
  }
}
