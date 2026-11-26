import { ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';

import { AuthSession, AuthSessionType, UserSession } from './auth-session';
import { SESSION_RESTRICTED } from './session-restriction';

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
  return requireUserSession(session).user;
}

/** Like `requireSessionUser`, for services that also need the roles. */
export function requireUserSession(session: AuthSession): UserSession {
  if (session.type !== AuthSessionType.User) {
    throw new ForbiddenException(
      'This needs a signed-in user; API keys and peering tokens have none.'
    );
  }

  return session;
}

/** The signed-in user's session, or nothing for anyone else. */
export function userSessionOf(
  session: AuthSession | null | undefined
): UserSession | undefined {
  return session?.type === AuthSessionType.User ? session : undefined;
}

/**
 * Like `userSessionOf`, for public operations a guest may take too
 * (commenting, rating, voting). The guard lets a restricted session into
 * everything public; these treat it as a guest, never as the reader.
 */
export function unrestrictedUserSessionOf(
  session: AuthSession | null | undefined
): UserSession | undefined {
  const userSession = userSessionOf(session);

  return userSession?.restricted ? undefined : userSession;
}

/**
 * Like `userSessionOf`, for public operations that act under the name of the
 * signed-in user and have no guest path to fall back to (subscribing without
 * naming a user). The guard lets a restricted session into everything public,
 * so these refuse it here.
 */
export function fullUserSessionOf(
  session: AuthSession | null | undefined
): UserSession | undefined {
  const userSession = userSessionOf(session);

  if (userSession?.restricted) {
    throw new ForbiddenException(SESSION_RESTRICTED);
  }

  return userSession;
}

/**
 * Like `actorOf`, for operations a peering token may do too: it records
 * nobody instead of a 403.
 */
export function actorUserIdOf(
  session: AuthSession | null | undefined
): string | undefined {
  return session && session.type !== AuthSessionType.Token ?
      actorOf(session).userId
    : undefined;
}
