import {User} from './user'

export interface Session {
  readonly user: User
  readonly token: string
  readonly expiryDate: Date
}

export type OptionalSession = Session | null

export interface DBSessionAdapter {
  createSessionForUser(user: User): Promise<OptionalSession>
  deleteSession(token: string): Promise<boolean>

  getSessionByToken(token: string): Promise<OptionalSession>
}
