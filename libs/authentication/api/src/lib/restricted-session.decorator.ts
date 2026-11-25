import { SetMetadata } from '@nestjs/common';

export const ALLOWS_RESTRICTED_SESSION_METADATA_KEY = 'allowsRestrictedSession';

/**
 * Lets a restricted session (a login code that confirmed no address yet) use
 * the handler. Everything that is not public refuses such a session unless it
 * says so here; `restricted-session-handlers.spec.ts` lists who does.
 */
export const AllowsRestrictedSession = () =>
  SetMetadata(ALLOWS_RESTRICTED_SESSION_METADATA_KEY, true);
