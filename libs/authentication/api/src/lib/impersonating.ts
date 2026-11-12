import { ForbiddenException } from '@nestjs/common';
import { AuthSession, AuthSessionType } from './auth-session';

export class ImpersonatingError extends ForbiddenException {
  constructor() {
    super('This is not possible while signed in as someone else.');
  }
}

export function assertNotImpersonating(
  session: AuthSession | null | undefined
) {
  if (session?.type === AuthSessionType.User && session.impersonatedBy) {
    throw new ImpersonatingError();
  }
}
