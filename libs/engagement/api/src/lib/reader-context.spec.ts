import { EngagementAudience, EngagementRequirement } from '@prisma/client';
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
  monthlyAmount: 1000,
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
      paying: false,
      newsletter: 'unknown',
    });
  });

  it('tells paying members from free ones', () => {
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
      paying: true,
      privileged: false,
    });

    expect(
      readerContextFrom({
        session: userSession(),
        subscriptions: [subscription({ monthlyAmount: 0 })],
      })
    ).toMatchObject({ activeMemberPlanIds: ['plan-1'], paying: false });
  });

  it('ignores subscriptions that ran out', () => {
    expect(
      readerContextFrom({
        session: userSession(),
        subscriptions: [subscription({ paidUntil: new Date('2026-10-01') })],
      })
    ).toMatchObject({ activeMemberPlanIds: [], paying: false });
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
  paying: false,
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
  paying: true,
});

describe('matchesAudience', () => {
  it.each([
    [EngagementAudience.ALL, [true, true, true, true]],
    [EngagementAudience.ANONYMOUS, [true, false, false, false]],
    [EngagementAudience.REGISTERED, [false, true, true, true]],
    [EngagementAudience.NON_MEMBERS, [true, true, false, false]],
    [EngagementAudience.MEMBERS, [false, false, true, true]],
    [EngagementAudience.NON_PAYING, [true, true, true, false]],
    [EngagementAudience.PAYING_MEMBERS, [false, false, false, true]],
    [EngagementAudience.PAYWALL_BYPASSED, [false, false, false, false]],
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
    [EngagementRequirement.PAID_MEMBERSHIP, [false, false, false, true]],
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
});
