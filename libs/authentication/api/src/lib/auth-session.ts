import { User, UserRole } from '@prisma/client';

export enum AuthSessionType {
  User = 'user',
  Token = 'token',
}

export type TokenSession = {
  type: AuthSessionType.Token;
  id: string;
  name: string;
  token: string;
  roles: UserRole[];
};

export type UserSession = {
  type: AuthSessionType.User;
  id: string;
  user: User;
  roles: UserRole[];
  createdAt: Date;
  expiresAt: Date;
  token: string;
};

export type AuthSession = TokenSession | UserSession;
