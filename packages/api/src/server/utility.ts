import {sign as signJWT, verify as verifyJWT} from 'jsonwebtoken'

export enum JWTAudience {
  Refresh = 'refresh',
  Access = 'access',
  Peer = 'peer'
}

export interface RefreshToken {
  email: string
  id: string
}

export function signRefreshToken(
  id: string,
  email: string,
  tokenSecret: string,
  expiresIn: number
): string {
  return signJWT({}, tokenSecret, {
    expiresIn,
    subject: `user:${email}`,
    audience: JWTAudience.Refresh,
    jwtid: id
  })
}

export function verifyRefreshToken(token: string, tokenSecret: string): RefreshToken {
  const tokenData = verifyJWT(token, tokenSecret, {
    audience: JWTAudience.Refresh
  }) as {sub: string; jti: string}

  return {
    email: tokenData.sub.split('user:')[1],
    id: tokenData.jti
  }
}

export function signAccessToken(email: string, tokenSecret: string, expiresIn: number): string {
  return signJWT({}, tokenSecret, {
    expiresIn,
    subject: `user:${email}`,
    audience: JWTAudience.Access
  })
}

export function verifyAccessToken(token: string, tokenSecret: string) {
  const tokenData = verifyJWT(token, tokenSecret, {
    audience: [JWTAudience.Access, JWTAudience.Peer]
  }) as {sub: string}

  return {
    email: tokenData.sub.split('user:')[1]
  }
}
