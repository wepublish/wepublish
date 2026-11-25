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
  AudienceOf,
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
  const { ANONYMOUS, MEMBERS, PAYWALL_BYPASSED, UTM } = EngagementAudience;
  const readers = [anonymous, registered, freeMember, payingMember];
  const audience = (
    audiences: EngagementAudience[] = [],
    excludedAudiences: EngagementAudience[] = [],
    more: Partial<AudienceOf> = {}
  ): AudienceOf => ({ audiences, excludedAudiences, ...more });

  it.each([
    ['everyone', audience(), [true, true, true, true]],
    ['only anonymous', audience([ANONYMOUS]), [true, false, false, false]],
    ['all but anonymous', audience([], [ANONYMOUS]), [false, true, true, true]],
    ['only members', audience([MEMBERS]), [false, false, true, true]],
    ['all but members', audience([], [MEMBERS]), [true, true, false, false]],
    [
      'only members of chosen plans',
      audience([MEMBERS], [], { audienceMemberPlanIds: ['paid', 'other'] }),
      [false, false, false, true],
    ],
    [
      'all but anonymous and members',
      audience([], [ANONYMOUS, MEMBERS]),
      [false, true, false, false],
    ],
  ])(
    '%s matches [anonymous, registered, free member, paying member]',
    (_name, rule, expected) => {
      expect(readers.map(r => matchesAudience(rule, r))).toEqual(expected);
    }
  );

  it('matches readers with a valid paywall bypass', () => {
    const rule = audience([PAYWALL_BYPASSED]);

    expect(matchesAudience(rule, anonymous)).toBe(false);
    expect(matchesAudience(rule, reader({ paywallBypassed: true }))).toBe(true);
  });

  it('matches readers who came from a link with one of the utm params', () => {
    const rule = audience([UTM], [], {
      audienceUtm: ['utm_medium=email', 'utm_source=newsletter'],
    });

    expect(matchesAudience(rule, reader({ utm: ['utm_medium=Email'] }))).toBe(
      true
    );
    expect(matchesAudience(rule, reader({ utm: ['utm_medium=social'] }))).toBe(
      false
    );
    expect(matchesAudience(rule, anonymous)).toBe(false);
  });

  it('leaves out excluded readers of an included segment', () => {
    const rule = audience([ANONYMOUS], [UTM], {
      audienceUtm: ['utm_medium=email'],
    });

    expect(matchesAudience(rule, anonymous)).toBe(true);
    expect(matchesAudience(rule, reader({ utm: ['utm_medium=email'] }))).toBe(
      false
    );
    expect(matchesAudience(rule, registered)).toBe(false);
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
