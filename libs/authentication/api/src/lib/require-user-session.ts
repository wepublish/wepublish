import { ForbiddenException } from '@nestjs/common';

import { AuthSession, AuthSessionType, UserSession } from './auth-session';

export const requireUserSession = (
  session: AuthSession | null | undefined
): UserSession => {
  if (session?.type !== AuthSessionType.User) {
    throw new ForbiddenException(
      'This needs a signed-in user. An API key cannot do it on behalf of its creator.'
    );
  }

  return session;
};
