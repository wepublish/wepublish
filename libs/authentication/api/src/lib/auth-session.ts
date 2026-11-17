import { User, UserRole } from '@prisma/client';

export enum AuthSessionType {
  User = 'user',
  Token = 'token',
  ApiToken = 'apiToken',
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
  impersonatedBy?: string | null;
  canImpersonate?: boolean;
};

export type ApiTokenSession = {
  type: AuthSessionType.ApiToken;
  id: string;
  name: string;
  token: string;
  /** The token's scopes that its creator still holds. */
  permissions: string[];
  /** The user the token acts on behalf of. */
  createdBy: Pick<User, 'id' | 'email'>;
};

export const EXPIRED_API_TOKEN = 'expired-api-token';

export type AuthSession = TokenSession | UserSession | ApiTokenSession;
