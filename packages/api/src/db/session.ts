import {User} from './user'
import {Peer} from './peer'

export enum SessionType {
  User = 'user',
  Peer = 'peer'
}

export interface PeerSession {
  type: SessionType.Peer
  peer: Peer
  token: string
}

export interface UserSession {
  type: SessionType.User
  id: string
  user: User
  createdAt: Date
  expiresAt: Date
  token: string
}

export type OptionalUserSession = UserSession | null

export type Session = PeerSession | UserSession
export type OptionalSession = Session | null

export interface DBSessionAdapter {
  createUserSession(user: User): Promise<OptionalUserSession>
  getUserSessions(user: User): Promise<UserSession[]>

  getSessionByID(user: User, id: string): Promise<OptionalSession>
  getSessionByToken(token: string): Promise<OptionalSession>

  deleteUserSessionByID(user: User, id: string): Promise<boolean>
  deleteUserSessionByToken(token: string): Promise<boolean>
}
