import {
  EngagementAudience,
  EngagementRequirement,
  PaymentPeriodicity,
} from '@prisma/client';
import {
  ApiTokenSession,
  AuthSessionType,
  TokenSession,
  UserSession,
} from '@wepublish/authentication/api';
import {
  ReaderContext,
  ReaderSubscription,
  matchesAudience,
  meetsRequirement,
  readerContextFrom,
} from './reader-context';

const role = (...permissionIDs: string[]) =>
  ({ id: 'role', permissionIDs }) as never;

const userSession = (...permissionIDs: string[]): UserSession =>
  ({
    type: AuthSessionType.User,
    id: 'session',
    user: { id: 'user-1' },
    roles: [role(...permissionIDs)],
  }) as unknown as UserSession;

const subscription = (
  overrides: Partial<ReaderSubscription> = {}
): ReaderSubscription => ({
  memberPlanId: 'plan-1',
  startsAt: new Date('2026-01-01'),
  paidUntil: new Date('2027-01-01'),
  gracePeriod: 0,
  ...overrides,
});

describe('readerContextFrom', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26'));
  });
  afterAll(() => vi.useRealTimers());

  it('knows nothing about an anonymous reader', () => {
    expect(readerContextFrom({ session: undefined })).toEqual({
      kind: 'anonymous',
      privileged: false,
      loggedIn: false,
      activeMemberPlanIds: [],
      newsletter: 'unknown',
    });
  });

  it('knows the plans of active subscriptions, each once', () => {
    expect(
      readerContextFrom({
        session: userSession(),
        subscriptions: [subscription()],
      })
    ).toMatchObject({
      kind: 'user',
      loggedIn: true,
      userId: 'user-1',
      activeMemberPlanIds: ['plan-1'],
      privileged: false,
    });

    expect(
      readerContextFrom({
        session: userSession(),
        subscriptions: [subscription(), subscription()],
      })
    ).toMatchObject({ activeMemberPlanIds: ['plan-1'] });
  });

  it('ignores subscriptions that ran out', () => {
    expect(
      readerContextFrom({
        session: userSession(),
        subscriptions: [subscription({ paidUntil: new Date('2026-10-01') })],
      })
    ).toMatchObject({ activeMemberPlanIds: [] });
  });

  it('knows a running monthly subscription, which could be paid yearly', () => {
    expect(
      readerContextFrom({
        session: userSession(),
        subscriptions: [
          subscription({
            id: 'yearly',
            paymentPeriodicity: PaymentPeriodicity.yearly,
          }),
          subscription({
            id: 'monthly',
            paymentPeriodicity: PaymentPeriodicity.monthly,
          }),
        ],
      })
    ).toMatchObject({ monthlySubscriptionId: 'monthly' });
  });

  it.each([
    ['cancelled', { deactivated: true }],
    ['not renewable', { extendable: false }],
    ['ran out', { paidUntil: new Date('2026-10-01') }],
    ['paid yearly', { paymentPeriodicity: PaymentPeriodicity.yearly }],
  ])('knows no monthly subscription when it is %s', (_, overrides) => {
    expect(
      readerContextFrom({
        session: userSession(),
        subscriptions: [
          subscription({
            id: 'monthly',
            paymentPeriodicity: PaymentPeriodicity.monthly,
            ...overrides,
          }),
        ],
      }).monthlySubscriptionId
    ).toBeUndefined();
  });

  it('lets editors read everything', () => {
    expect(
      readerContextFrom({ session: userSession('CAN_GET_ARTICLE') })
    ).toMatchObject({ privileged: true });
  });

  it('lets previews read everything, only with the preview permission', () => {
    expect(
      readerContextFrom({
        session: userSession('CAN_PREVIEW'),
        previewHeader: true,
      })
    ).toMatchObject({ privileged: true });

    expect(
      readerContextFrom({ session: userSession(), previewHeader: true })
    ).toMatchObject({ privileged: false });
  });

  it('lets peers read everything', () => {
    const peer = {
      type: AuthSessionType.Token,
      id: 'peer',
      name: 'peer',
      token: 'x',
      roles: [],
    } satisfies TokenSession;

    expect(readerContextFrom({ session: peer })).toMatchObject({
      kind: 'peer',
      privileged: true,
    });
  });

  it('reads the permissions of an api token, which has no roles', () => {
    const apiToken = (...permissions: string[]): ApiTokenSession => ({
      type: AuthSessionType.ApiToken,
      id: 'token',
      name: 'app',
      token: 'x',
      permissions,
    });

    expect(readerContextFrom({ session: apiToken() })).toMatchObject({
      kind: 'apiToken',
      privileged: false,
      loggedIn: false,
    });
    expect(
      readerContextFrom({ session: apiToken('CAN_GET_ARTICLE') })
    ).toMatchObject({ kind: 'apiToken', privileged: true });
  });
});

const reader = (overrides: Partial<ReaderContext> = {}): ReaderContext => ({
  kind: 'anonymous',
  privileged: false,
  loggedIn: false,
  activeMemberPlanIds: [],
  newsletter: 'unknown',
  ...overrides,
});

const anonymous = reader();
const registered = reader({ kind: 'user', loggedIn: true, userId: 'u' });
const freeMember = reader({
  kind: 'user',
  loggedIn: true,
  userId: 'u',
  activeMemberPlanIds: ['free'],
});
const payingMember = reader({
  kind: 'user',
  loggedIn: true,
  userId: 'u',
  activeMemberPlanIds: ['paid'],
});

describe('matchesAudience', () => {
  it.each([
    [EngagementAudience.ALL, [true, true, true, true]],
    [EngagementAudience.ANONYMOUS, [true, false, false, false]],
    [EngagementAudience.REGISTERED, [false, true, true, true]],
    [EngagementAudience.NON_MEMBERS, [true, true, false, false]],
    [EngagementAudience.MEMBERS, [false, false, true, true]],
    [EngagementAudience.PAYWALL_BYPASSED, [false, false, false, false]],
    // Without plans to match.
    [EngagementAudience.MEMBER_PLANS, [false, false, false, false]],
    // None of them pays monthly.
    [EngagementAudience.MONTHLY_MEMBERS, [false, false, false, false]],
  ])(
    '%s matches [anonymous, registered, free member, paying member] = %j',
    (audience, expected) => {
      expect(
        [anonymous, registered, freeMember, payingMember].map(r =>
          matchesAudience(audience, r)
        )
      ).toEqual(expected);
    }
  );

  it('matches readers with a subscription to one of the plans', () => {
    expect(
      [anonymous, registered, freeMember, payingMember].map(r =>
        matchesAudience(EngagementAudience.MEMBER_PLANS, r, ['paid', 'other'])
      )
    ).toEqual([false, false, false, true]);
  });

  it('ignores plans for the other audiences', () => {
    expect(
      matchesAudience(EngagementAudience.ANONYMOUS, anonymous, ['paid'])
    ).toBe(true);
  });

  it('matches readers with a monthly subscription', () => {
    expect(
      matchesAudience(
        EngagementAudience.MONTHLY_MEMBERS,
        reader({ ...payingMember, monthlySubscriptionId: 'monthly' })
      )
    ).toBe(true);
  });

  it('matches readers with a valid paywall bypass', () => {
    expect(
      matchesAudience(
        EngagementAudience.PAYWALL_BYPASSED,
        reader({ paywallBypassed: true })
      )
    ).toBe(true);
  });
});

describe('meetsRequirement', () => {
  it.each([
    [EngagementRequirement.REGISTRATION, [false, true, true, true]],
    [EngagementRequirement.MEMBERSHIP, [false, false, true, true]],
    [EngagementRequirement.NEWSLETTER, [false, false, false, false]],
  ])(
    '%s is met by [anonymous, registered, free member, paying member] = %j',
    (requirement, expected) => {
      expect(
        [anonymous, registered, freeMember, payingMember].map(r =>
          meetsRequirement(requirement, r)
        )
      ).toEqual(expected);
    }
  );

  it('is met for the newsletter by an email, not by an account', () => {
    expect(
      meetsRequirement(EngagementRequirement.NEWSLETTER, {
        ...anonymous,
        newsletter: 'subscribed',
      })
    ).toBe(true);
  });
});
