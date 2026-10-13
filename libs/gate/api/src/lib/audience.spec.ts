import { LoginStatus } from '@prisma/client';
import { audienceRanking, GateReader, matchesAudience } from './audience';

const reader = (overrides: Partial<GateReader> = {}): GateReader => ({
  loggedIn: false,
  hasSubscription: false,
  hasPaywallBypass: false,
  ...overrides,
});

const anonymous = reader();
const loggedIn = reader({ loggedIn: true });
const subscriber = reader({ loggedIn: true, hasSubscription: true });
const subscribedButLoggedOut = reader({ hasSubscription: true });

describe('audienceRanking', () => {
  it.each<[string, GateReader, LoginStatus[]]>([
    [
      'an anonymous reader',
      anonymous,
      [LoginStatus.LOGGED_OUT, LoginStatus.UNSUBSCRIBED, LoginStatus.ALL],
    ],
    [
      'a logged-in reader without a subscription',
      loggedIn,
      [LoginStatus.UNSUBSCRIBED, LoginStatus.LOGGED_IN, LoginStatus.ALL],
    ],
    [
      'a subscriber',
      subscriber,
      [LoginStatus.SUBSCRIBED, LoginStatus.LOGGED_IN, LoginStatus.ALL],
    ],
    [
      'an anonymous reader with a paywall bypass',
      reader({ hasPaywallBypass: true }),
      [
        LoginStatus.PAYWALL_BYPASSED,
        LoginStatus.LOGGED_OUT,
        LoginStatus.UNSUBSCRIBED,
        LoginStatus.ALL,
      ],
    ],
    [
      'a subscriber with a paywall bypass',
      reader({ loggedIn: true, hasSubscription: true, hasPaywallBypass: true }),
      [
        LoginStatus.PAYWALL_BYPASSED,
        LoginStatus.SUBSCRIBED,
        LoginStatus.LOGGED_IN,
        LoginStatus.ALL,
      ],
    ],
    // The website never sends this, so it only matches gates for everyone.
    [
      'a subscriber who is not logged in',
      subscribedButLoggedOut,
      [LoginStatus.ALL],
    ],
  ])('ranks the audiences of %s, best fit first', (_, who, ranking) => {
    expect(audienceRanking(who)).toEqual(ranking);
  });
});

describe('matchesAudience', () => {
  it.each<[LoginStatus, GateReader, boolean]>([
    // A registration wall: logging in lifts it.
    [LoginStatus.LOGGED_OUT, anonymous, true],
    [LoginStatus.LOGGED_OUT, loggedIn, false],
    [LoginStatus.LOGGED_OUT, subscriber, false],
    // A subscription wall: only an active subscription lifts it.
    [LoginStatus.UNSUBSCRIBED, anonymous, true],
    [LoginStatus.UNSUBSCRIBED, loggedIn, true],
    [LoginStatus.UNSUBSCRIBED, subscriber, false],
    [LoginStatus.LOGGED_IN, anonymous, false],
    [LoginStatus.LOGGED_IN, loggedIn, true],
    [LoginStatus.SUBSCRIBED, loggedIn, false],
    [LoginStatus.SUBSCRIBED, subscriber, true],
    [LoginStatus.PAYWALL_BYPASSED, anonymous, false],
    [LoginStatus.PAYWALL_BYPASSED, reader({ hasPaywallBypass: true }), true],
    [LoginStatus.ALL, anonymous, true],
    [LoginStatus.ALL, subscriber, true],
    [LoginStatus.LOGGED_OUT, subscribedButLoggedOut, false],
    [LoginStatus.UNSUBSCRIBED, subscribedButLoggedOut, false],
    [LoginStatus.ALL, subscribedButLoggedOut, true],
  ])('%s matches %o: %s', (audience, who, expected) => {
    expect(matchesAudience(audience, who)).toBe(expected);
  });
});
