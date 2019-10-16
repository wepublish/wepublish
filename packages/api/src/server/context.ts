import {IncomingMessage} from 'http'
import {TokenExpiredError as JWTTokenExpiredError} from 'jsonwebtoken'

import {parse as parseQueryString} from 'querystring'
import {Adapter, AdapterUser} from './adapter'
import {verifyAccessToken} from './utility'
import {GraphQLError} from 'graphql'
import {TokenExpiredError, InvalidTokenError} from './graphql/error'

export interface ContextRequest extends IncomingMessage {
  adapter: Adapter
}

export interface Context {
  adapter: Adapter
  tokenSecret: string
  refreshTokenExpiresIn: number
  accessTokenExpiresIn: number
  authentication: AuthenticationContext
}

export interface ContextOptions {
  adapter: Adapter
  tokenSecret: string
  refreshTokenExpiresIn: number
  accessTokenExpiresIn: number
}

export enum AuthenticationContextType {
  User = 'user',
  Peer = 'peer',
  Unauthenticated = 'unauthenticated'
}

export interface UserAuthenticationContext {
  type: AuthenticationContextType.User
  token: string
  user: AdapterUser
}

export interface PeerAuthenticationContext {
  type: AuthenticationContextType.Peer
  token: string
  peer: any // TODO
}

export interface UnauthenticatedAuthenticationContext {
  type: AuthenticationContextType.Unauthenticated
  error: TokenExpiredError | InvalidTokenError
}

export type AuthenticationContext =
  | UnauthenticatedAuthenticationContext
  | UserAuthenticationContext
  | PeerAuthenticationContext

export function tokenFromRequest(req: IncomingMessage) {
  if (req.headers.authorization) {
    const [token] = req.headers.authorization.match(/Bearer (.+?$)/i) || []
    return token || null
  } else if (req.url) {
    const token = parseQueryString(req.url.split('?')[1])['token']
    return typeof token === 'string' ? token : null
  }

  return null
}

export async function contextFromRequest(
  req: IncomingMessage,
  {adapter, tokenSecret, refreshTokenExpiresIn, accessTokenExpiresIn}: ContextOptions
): Promise<Context> {
  let authentication: AuthenticationContext

  const token = tokenFromRequest(req)

  if (token) {
    try {
      const {email} = verifyAccessToken(token, tokenSecret)
      const user = email ? await adapter.userForEmail(email) : null

      authentication = user
        ? {type: AuthenticationContextType.User, token, user}
        : {type: AuthenticationContextType.Unauthenticated, error: new InvalidTokenError()}
    } catch (err) {
      authentication =
        err instanceof JWTTokenExpiredError
          ? {type: AuthenticationContextType.Unauthenticated, error: new TokenExpiredError()}
          : {type: AuthenticationContextType.Unauthenticated, error: new InvalidTokenError()}
    }
  } else {
    authentication = {
      type: AuthenticationContextType.Unauthenticated,
      error: new InvalidTokenError()
    }
  }

  return {
    adapter,
    tokenSecret,
    refreshTokenExpiresIn,
    accessTokenExpiresIn,
    authentication
  }
}
