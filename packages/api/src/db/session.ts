import {UserRole} from '@prisma/client'
import {User} from './user'

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

export type Session = TokenSession | UserSession
