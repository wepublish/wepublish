import { LoginStatus, UserRole } from '@prisma/client';
import { AuthSessionType } from '@wepublish/authentication/api';
import { CanGetArticle } from '@wepublish/permissions';
import { isContentGated } from './content-gate-access';

const gate = { active: true, audience: LoginStatus.LOGGED_OUT };
const article = { paywallId: null, contentGateDisabled: false };

const userSession = (permissions: string[] = []) =>
  ({
    type: AuthSessionType.User,
    roles: [{ permissionIDs: permissions } as UserRole],
  }) as any;

const tokenSession = {
  type: AuthSessionType.Token,
  roles: [] as UserRole[],
} as any;

const noSubscription = vi.fn(async () => false);
const withSubscription = vi.fn(async () => true);

describe('isContentGated', () => {
  beforeEach(() => {
    noSubscription.mockClear();
    withSubscription.mockClear();
  });

  it('gates anonymous readers when an active gate applies', async () => {
    expect(
      await isContentGated({
        gate,
        article,
        hasActiveSubscription: noSubscription,
      })
    ).toBe(true);
  });

  it.each([
    ['there is no gate', { gate: null }],
    ['the gate is inactive', { gate: { ...gate, active: false } }],
    [
      'the article has a paywall, which takes precedence',
      { article: { ...article, paywallId: 'paywall-1' } },
    ],
    [
      'the article opted out',
      { article: { ...article, contentGateDisabled: true } },
    ],
    [
      'the reader may read every article anyway',
      { session: userSession([CanGetArticle.id]) },
    ],
    ['a peer or api token reads it', { session: tokenSession }],
    [
      'a logged-in reader meets a registration gate',
      { session: userSession() },
    ],
  ])('does not gate when %s', async (_, overrides) => {
    expect(
      await isContentGated({
        gate,
        article,
        hasActiveSubscription: noSubscription,
        ...overrides,
      })
    ).toBe(false);
  });

  it('does not look up subscriptions of logged-in readers for a registration gate', async () => {
    await isContentGated({
      gate,
      article,
      session: userSession(),
      hasActiveSubscription: withSubscription,
    });

    expect(withSubscription).not.toHaveBeenCalled();
  });

  describe('a gate for everyone without a subscription', () => {
    const subscriberGate = {
      ...gate,
      audience: LoginStatus.UNSUBSCRIBED,
    };

    it('still gates logged-in readers without a subscription', async () => {
      expect(
        await isContentGated({
          gate: subscriberGate,
          article,
          session: userSession(),
          hasActiveSubscription: noSubscription,
        })
      ).toBe(true);
    });

    it('lets subscribers read', async () => {
      expect(
        await isContentGated({
          gate: subscriberGate,
          article,
          session: userSession(),
          hasActiveSubscription: withSubscription,
        })
      ).toBe(false);
    });

    it('does not look up subscriptions of anonymous readers', async () => {
      await isContentGated({
        gate: subscriberGate,
        article,
        hasActiveSubscription: withSubscription,
      });

      expect(withSubscription).not.toHaveBeenCalled();
    });
  });
});
