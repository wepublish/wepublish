import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { canReachLoadedEvent } from './event-reach';

const member = (...organizationIds: string[]) =>
  ({
    type: AuthSessionType.User,
    user: { id: 'user-1' },
    roles: [],
    organizationIds,
  }) as unknown as AuthSession;

const event = { organizationId: 'org-a', ownerId: 'owner-1', placeId: 'p1' };

const placeLoader = (organizationId: string | null) => ({
  load: vi.fn(async () => ({ organizationId })),
});

describe('canReachLoadedEvent', () => {
  it('reaches an event of an own organisation without loading its venue', async () => {
    const places = placeLoader('org-v');

    await expect(
      canReachLoadedEvent(member('org-a'), event, places)
    ).resolves.toBe(true);
    expect(places.load).not.toHaveBeenCalled();
  });

  it("reaches an event through its venue's organisation", async () => {
    const places = placeLoader('org-v');

    await expect(
      canReachLoadedEvent(member('org-v'), event, places)
    ).resolves.toBe(true);
    expect(places.load).toHaveBeenCalledWith('p1');
  });

  it('does not reach an event of another organisation', async () => {
    await expect(
      canReachLoadedEvent(member('org-b'), event, placeLoader('org-v'))
    ).resolves.toBe(false);
  });

  it('does not reach an event without venue for strangers', async () => {
    const places = placeLoader('org-b');

    await expect(
      canReachLoadedEvent(member('org-b'), { ...event, placeId: null }, places)
    ).resolves.toBe(false);
    expect(places.load).not.toHaveBeenCalled();
  });

  it('does not reach anything anonymously', async () => {
    await expect(
      canReachLoadedEvent(undefined, event, placeLoader(null))
    ).resolves.toBe(false);
  });
});
