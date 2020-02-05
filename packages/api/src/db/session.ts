import {User} from './user'

export interface Session {
  readonly user: User
  readonly token: string
  readonly createdAt: Date
  readonly expiresAt: Date
}

export type OptionalSession = Session | null

export interface DBSessionAdapter {
  createSessionForUser(user: User): Promise<OptionalSession>
  deleteSessionByToken(token: string): Promise<boolean>
  getSessionByToken(token: string): Promise<OptionalSession>
}
