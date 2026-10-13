import { LoginStatus } from '@prisma/client';

export type GateReader = {
  loggedIn: boolean;
  hasSubscription: boolean;
  hasPaywallBypass: boolean;
};

/**
 * The audiences a reader belongs to, best fit first. `ALL` always comes last.
 * A subscriber who is not logged in (the website never sends that) only
 * belongs to `ALL`.
 */
export function audienceRanking({
  loggedIn,
  hasSubscription,
  hasPaywallBypass,
}: GateReader): LoginStatus[] {
  let ranking: LoginStatus[] = [];

  if (!hasSubscription && !loggedIn) {
    ranking = [LoginStatus.LOGGED_OUT, LoginStatus.UNSUBSCRIBED];
  }

  if (!hasSubscription && loggedIn) {
    ranking = [LoginStatus.UNSUBSCRIBED, LoginStatus.LOGGED_IN];
  }

  if (hasSubscription && loggedIn) {
    ranking = [LoginStatus.SUBSCRIBED, LoginStatus.LOGGED_IN];
  }

  if (hasPaywallBypass) {
    ranking = [LoginStatus.PAYWALL_BYPASSED, ...ranking];
  }

  return [...ranking, LoginStatus.ALL];
}

export function matchesAudience(audience: LoginStatus, reader: GateReader) {
  return audienceRanking(reader).includes(audience);
}
