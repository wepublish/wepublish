import { User } from '@prisma/client';

import { AuthSession, AuthSessionType } from './auth-session';

export const actingUserOf = (
  session: AuthSession | null | undefined
): User | null => {
  switch (session?.type) {
    case AuthSessionType.User:
    case AuthSessionType.ApiToken:
      return session.user ?? null;

    default:
      return null;
  }
};
