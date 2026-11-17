import { ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';

import { AuthSession, AuthSessionType } from './auth-session';

/** Who answers for an action: a user, and the api key if one was used. */
export type SessionActor = {
  userId: string;
  apiTokenId: string | null;
};

/**
 * For operations that record who did them. An api key acts on behalf of the
 * user who created it; a peering token has nobody behind it.
 */
export function actorOf(session: AuthSession): SessionActor {
  switch (session.type) {
    case AuthSessionType.User:
      return { userId: session.user.id, apiTokenId: null };

    case AuthSessionType.ApiToken:
      return { userId: session.createdBy.id, apiTokenId: session.id };

    default:
      throw new ForbiddenException(
        'This needs a signed-in user or an API key; peering tokens have no user.'
      );
  }
}

/**
 * For operations on the caller's own account (my invoices, my 2FA). An api key
 * is not its creator here, so `@CurrentUser() session: UserSession` alone is
 * not enough: the decorator returns whatever session authenticated.
 */
export function requireSessionUser(session: AuthSession): User {
  if (session.type !== AuthSessionType.User) {
    throw new ForbiddenException(
      'This needs a signed-in user; API keys and peering tokens have none.'
    );
  }

  return session.user;
}
