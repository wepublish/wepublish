import {sign as signJWT, verify as verifyJWT} from 'jsonwebtoken'

export enum JWTAudience {
  Refresh = 'refresh',
  Access = 'access'
}

export enum AccessScope {
  Admin = 'admin',
  ArticleWrite = 'article:write',
  ArticleRead = 'article:read',
  PeerWrite = '',
  PeerRead = '',
  PeerTokenRead = 'peer_token:read',
  PeerTokenWrite = 'peer_token:write',
  UserSessionRead = 'user_token:read',
  UserSessionWrite = 'user_token:write'
}

export interface RefreshToken {
  type: SubjectType
  subject: string
  id: string
  scope: AccessScope[]
}

export interface AccessToken {
  type: SubjectType
  subject: string
  scope: AccessScope[]
}

export enum SubjectType {
  User = 'user',
  Peer = 'peer'
}

export interface Subject {
  type: SubjectType
  id: string
}

export function signRefreshToken(
  id: string,
  subjectType: SubjectType,
  subject: string,
  scope: AccessScope[],
  expiresIn: number,
  tokenSecret: string
): string {
  return signJWT({scope}, tokenSecret, {
    expiresIn,
    subject: `${subjectType}:${subject}`,
    algorithm: 'HS256',
    audience: JWTAudience.Refresh,
    jwtid: id
  })
}

export function verifyRefreshToken(token: string, tokenSecret: string): RefreshToken {
  const {sub: subjectString, jti: id, scope} = verifyJWT(token, tokenSecret, {
    algorithms: ['HS256'],
    audience: JWTAudience.Refresh
  }) as {sub: string; jti: string; scope: AccessScope[]}

  const [type, subject] = subjectString.split(':')

  return {
    id,
    type: type as SubjectType,
    subject,
    scope
  }
}

export function signAccessToken(
  subjectType: SubjectType,
  subject: string,
  scope: AccessScope[],
  expiresIn: number,
  tokenSecret: string
): string {
  return signJWT({scope}, tokenSecret, {
    expiresIn,
    subject: `${subjectType}:${subject}`,
    algorithm: 'HS256',
    audience: JWTAudience.Access
  })
}

export function verifyAccessToken(token: string, tokenSecret: string) {
  const {scope, sub: subjectString} = verifyJWT(token, tokenSecret, {
    algorithms: ['HS256'],
    audience: [JWTAudience.Access]
  }) as {scope: AccessScope[]; sub: string}

  const [subjectType, subject] = subjectString.split(':')

  return {
    subjectType,
    subject,
    scope
  }
}
