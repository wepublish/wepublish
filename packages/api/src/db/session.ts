import {User} from './user'
import {UserRole} from './userRole'

export interface Session {
  readonly id: string
  readonly user: User
  readonly roles: UserRole[]
  readonly createdAt: Date
  readonly expiresAt: Date
}

export interface SessionWithToken extends Session {
  readonly token: string
}

export type OptionalSession = Session | null
export type OptionalSessionWithToken = SessionWithToken | null

export interface DBSessionAdapter {
  createSessionForUser(user: User): Promise<OptionalSessionWithToken>

  getSessionsForUser(user: User): Promise<Session[]>
  getSessionByID(user: User, id: string): Promise<OptionalSession>
  getSessionByToken(token: string): Promise<OptionalSessionWithToken>

  deleteSessionByID(user: User, id: string): Promise<boolean>
  deleteSessionByToken(token: string): Promise<boolean>
}
