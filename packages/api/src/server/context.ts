import {IncomingMessage} from 'http'
import {TokenExpiredError as JWTTokenExpiredError} from 'jsonwebtoken'

import {parse as parseQueryString} from 'querystring'
import {Adapter, AdapterUser} from './adapter'
import {verifyAccessToken, AccessScope, SubjectType} from './utility'
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
  scope: AccessScope[]
}

export interface PeerAuthenticationContext {
  type: AuthenticationContextType.Peer
  token: string
  peer: any // TODO
  scope: AccessScope[]
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
  const token = tokenFromRequest(req)

  return {
    adapter,
    tokenSecret,
    refreshTokenExpiresIn,
    accessTokenExpiresIn,
    authentication: await authenticationContextForToken(token, adapter, tokenSecret)
  }
}

export async function authenticationContextForToken(
  token: string | null,
  adapter: Adapter,
  tokenSecret: string
): Promise<AuthenticationContext> {
  if (token) {
    try {
      const {subjectType, subject, scope} = verifyAccessToken(token, tokenSecret)

      switch (subjectType) {
        case SubjectType.User:
          const user = await adapter.userForID(subject)
          return user
            ? {type: AuthenticationContextType.User, token, user, scope}
            : {type: AuthenticationContextType.Unauthenticated, error: new InvalidTokenError()}

        case SubjectType.Peer:
          const peer = {} // TODO
          return peer
            ? {type: AuthenticationContextType.Peer, token, peer, scope}
            : {type: AuthenticationContextType.Unauthenticated, error: new InvalidTokenError()}
      }
    } catch (err) {
      return err instanceof JWTTokenExpiredError
        ? {type: AuthenticationContextType.Unauthenticated, error: new TokenExpiredError()}
        : {type: AuthenticationContextType.Unauthenticated, error: new InvalidTokenError()}
    }
  }

  return {
    type: AuthenticationContextType.Unauthenticated,
    error: new InvalidTokenError()
  }
}
