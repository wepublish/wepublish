import { ForbiddenException } from '@nestjs/common';

export class ManagedByWepublishLoginError extends ForbiddenException {
  constructor() {
    super(
      'This account is managed by the We.Publish login and cannot be changed here.'
    );
  }
}

export const isManagedByWepublishLogin = (
  user: { wepublishLoginSubject?: string | null } | null | undefined
) => !!user?.wepublishLoginSubject;

export function assertNotManagedByWepublishLogin(
  user: { wepublishLoginSubject?: string | null } | null | undefined
) {
  if (isManagedByWepublishLogin(user)) {
    throw new ManagedByWepublishLoginError();
  }
}
