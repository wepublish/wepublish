import {User} from './user'
import {UserRole} from './userRole'

export enum SessionType {
  User = 'user',
  Token = 'token'
}

export interface TokenSession {
  type: SessionType.Token
  id: string
  name: string
  token: string
  roles: UserRole[]
}

export interface UserSession {
  type: SessionType.User
  id: string
  user: User
  roles: UserRole[]
  createdAt: Date
  expiresAt: Date
  token: string
}

export type OptionalUserSession = UserSession | null

export type Session = TokenSession | UserSession
export type OptionalSession = Session | null

export interface DBSessionAdapter {
  createUserSession(user: User): Promise<OptionalUserSession>
  getUserSessions(user: User): Promise<UserSession[]>

  getSessionByID(user: User, id: string): Promise<OptionalSession>
  getSessionByToken(token: string): Promise<OptionalSession>

  deleteUserSessionByID(user: User, id: string): Promise<boolean>
  deleteUserSessionByToken(token: string): Promise<boolean>
}
