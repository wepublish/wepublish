import { Gate, LoginStatus } from '@prisma/client';
import {
  AuthSessionType,
  AuthSession,
  ApiTokenSession,
} from '@wepublish/authentication/api';
import { matchesAudience } from '@wepublish/gate/api';
import { CanGetArticle } from '@wepublish/permissions';
import { hasPermission } from '@wepublish/permissions/api';

export type ContentGateAccessInput = {
  gate: Pick<Gate, 'active' | 'audience'> | null | undefined;
  article: { paywallId?: string | null; contentGateDisabled: boolean };
  session?: AuthSession | null;
  hasActiveSubscription: () => Promise<boolean>;
};

export async function isContentGated({
  gate,
  article,
  session,
  hasActiveSubscription,
}: ContentGateAccessInput): Promise<boolean> {
  if (!gate?.active || article.paywallId || article.contentGateDisabled) {
    return false;
  }

  if (
    session?.type === AuthSessionType.Token ||
    (session &&
      hasPermission(
        CanGetArticle,
        (session as Exclude<AuthSession, ApiTokenSession>).roles
      ))
  ) {
    return false;
  }

  const loggedIn = !!session;

  return matchesAudience(gate.audience, {
    loggedIn,
    hasSubscription:
      loggedIn &&
      gate.audience !== LoginStatus.LOGGED_OUT &&
      (await hasActiveSubscription()),
    hasPaywallBypass: false,
  });
}
