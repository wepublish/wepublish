import { Gate, LoginStatus } from '@prisma/client';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { matchesAudience } from '@wepublish/gate/api';
import { CanGetArticle } from '@wepublish/permissions';
import { hasPermission } from '@wepublish/permissions/api';

export type ContentGateAccessInput = {
  gate: Pick<Gate, 'active' | 'audience'> | null | undefined;
  article: { paywallId?: string | null; contentGateDisabled: boolean };
  session?: AuthSession | null;
  hasActiveSubscription: () => Promise<boolean>;
};

/**
 * Whether the reader only gets the preview of an article.
 * The meter (free/soft/hard) runs on the website, the server only knows
 * whether the reader is someone the gate is meant for at all.
 */
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
    (session && hasPermission(CanGetArticle, session.roles))
  ) {
    return false;
  }

  const loggedIn = !!session;

  return matchesAudience(gate.audience, {
    loggedIn,
    // Logging in already lifts a registration gate.
    hasSubscription:
      loggedIn &&
      gate.audience !== LoginStatus.LOGGED_OUT &&
      (await hasActiveSubscription()),
    hasPaywallBypass: false,
  });
}
