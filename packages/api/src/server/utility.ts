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

export function signAccessToken(email: string, tokenSecret: string, expiresIn: number): string {
  return signJWT({}, tokenSecret, {
    expiresIn,
    subject: `user:${email}`,
    audience: JWTAudience.Access
  })
}

export function verifyRefreshToken(token: string): RefreshToken {
  const tokenData = verifyJWT(token, 'secret', {
    audience: JWTAudience.Refresh
  }) as {sub: string; jti: string}

  return {
    email: tokenData.sub.split('user:')[1],
    id: tokenData.jti
  }
}
