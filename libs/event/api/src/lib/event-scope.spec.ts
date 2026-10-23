import { Prisma } from '@prisma/client';
import {
  AuthSession,
  AuthSessionType,
  UserSession,
} from '@wepublish/authentication/api';
import {
  CanDeleteOtherOrganizationEvents,
  CanGetOtherOrganizationEvents,
  CanGetOtherOrganizations,
  CanPublishEvent,
  CanUpdateOrganization,
  CanUpdateOtherOrganizationEvents,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';
import {
  canDeleteEvent,
  canManageOrganization,
  canManagePlace,
  canSeeOrganization,
  canModifyEvent,
  canPublishEvent,
  canReadOrganizationSensitiveData,
  editorEventsWhere,
  EventOwnership,
  isOrganizationMember,
  boundOrganizationIdOf,
  mayAssignEventOrganization,
  mayAssignEventOwner,
  mayMoveEventToOrganization,
  mayReassignEventOwner,
  publicEventsWhere,
  reachableEventsWhere,
  mayUpdateAnyOrganization,
  memberOrganizationsWhere,
  organizationIdsOf,
  selectablePlacesWhere,
  visibleOrganizationsWhere,
  visiblePlacesWhere,
} from './event-scope';

const user = (
  organizationIds: string[],
  ...permissionIDs: string[]
): AuthSession =>
  ({
    type: AuthSessionType.User,
    id: 'session-1',
    token: 'token',
    user: { id: 'user-1' },
    roles: [{ id: 'role', permissionIDs }],
    organizationIds,
    createdAt: new Date(),
    expiresAt: new Date(),
  }) as AuthSession;

const peer = (...permissionIDs: string[]): AuthSession => ({
  type: AuthSessionType.Token,
  id: 'peer-1',
  name: 'Peer',
  token: 'token',
  roles: [{ id: 'peer', permissionIDs } as any],
});

const apiKey = (...permissions: string[]): AuthSession => ({
  type: AuthSessionType.ApiToken,
  id: 'key-1',
  name: 'Partner app',
  token: 'token',
  permissions,
  organizationId: null,
});

const organizationKey = (
  organizationId: string,
  ...permissions: string[]
): AuthSession => ({
  type: AuthSessionType.ApiToken,
  id: 'key-2',
  name: 'Venue app',
  token: 'token',
  permissions,
  organizationId,
});

describe('organizationIdsOf', () => {
  it('is the organisations of a user', () => {
    expect(organizationIdsOf(user(['a', 'b']))).toEqual(['a', 'b']);
  });

  it('is empty for a peer, a platform api key and nobody', () => {
    expect(organizationIdsOf(peer())).toEqual([]);
    expect(organizationIdsOf(apiKey())).toEqual([]);
    expect(organizationIdsOf(null)).toEqual([]);
    expect(organizationIdsOf(undefined)).toEqual([]);
  });

  it('is the organisation an api key is bound to', () => {
    expect(organizationIdsOf(organizationKey('a'))).toEqual(['a']);
  });
});

describe('isOrganizationMember', () => {
  it('is true for a member only', () => {
    expect(isOrganizationMember(user(['a']), 'a')).toBe(true);
    expect(isOrganizationMember(user(['a']), 'b')).toBe(false);
  });

  it('is false without an organisation', () => {
    expect(isOrganizationMember(user(['a']), null)).toBe(false);
    expect(isOrganizationMember(user(['a']), undefined)).toBe(false);
  });

  it('is false for a platform api key, which belongs to no organisation', () => {
    expect(
      isOrganizationMember(apiKey(CanUpdateOtherOrganizations.id), 'a')
    ).toBe(false);
  });

  it('is true for an api key of that organisation only', () => {
    expect(isOrganizationMember(organizationKey('a'), 'a')).toBe(true);
    expect(isOrganizationMember(organizationKey('a'), 'b')).toBe(false);
  });
});

describe('mayUpdateAnyOrganization', () => {
  it('is CAN_UPDATE_OTHER_ORGANIZATIONS for users, peers and platform keys', () => {
    expect(
      mayUpdateAnyOrganization(user([], CanUpdateOtherOrganizations.id))
    ).toBe(true);
    expect(mayUpdateAnyOrganization(peer(CanUpdateOtherOrganizations.id))).toBe(
      true
    );
    expect(
      mayUpdateAnyOrganization(apiKey(CanUpdateOtherOrganizations.id))
    ).toBe(true);
    expect(mayUpdateAnyOrganization(user([]))).toBe(false);
    expect(mayUpdateAnyOrganization(undefined)).toBe(false);
  });

  it('is never true for an api key bound to an organisation', () => {
    expect(
      mayUpdateAnyOrganization(
        organizationKey('a', CanUpdateOtherOrganizations.id)
      )
    ).toBe(false);
  });
});

describe('visibleOrganizationsWhere', () => {
  it('shows anonymous callers the enabled organisations', () => {
    expect(visibleOrganizationsWhere(undefined)).toEqual({ enabled: true });
    expect(visibleOrganizationsWhere(null)).toEqual({ enabled: true });
  });

  it('shows a user without organisations the enabled ones', () => {
    expect(visibleOrganizationsWhere(user([]))).toEqual({ enabled: true });
  });

  it('also shows members their own, even when disabled', () => {
    expect(visibleOrganizationsWhere(user(['a']))).toEqual({
      OR: [{ enabled: true }, { id: { in: ['a'] } }],
    });
  });

  it('shows everything to whoever may update any organisation', () => {
    expect(
      visibleOrganizationsWhere(user([], CanUpdateOtherOrganizations.id))
    ).toEqual({});
    expect(
      visibleOrganizationsWhere(apiKey(CanUpdateOtherOrganizations.id))
    ).toEqual({});
    expect(
      visibleOrganizationsWhere(peer(CanUpdateOtherOrganizations.id))
    ).toEqual({});
  });

  it('shows everything to whoever may read any organisation', () => {
    expect(
      visibleOrganizationsWhere(user([], CanGetOtherOrganizations.id))
    ).toEqual({});
    expect(
      visibleOrganizationsWhere(apiKey(CanGetOtherOrganizations.id))
    ).toEqual({});
  });

  it('shows an api key without that permission the enabled ones', () => {
    expect(visibleOrganizationsWhere(apiKey())).toEqual({ enabled: true });
  });

  it('shows an api key of an organisation that one too, even when disabled', () => {
    expect(visibleOrganizationsWhere(organizationKey('a'))).toEqual({
      OR: [{ enabled: true }, { id: { in: ['a'] } }],
    });
  });

  it('keeps an api key of an organisation to it even with a cross-organisation permission', () => {
    expect(
      visibleOrganizationsWhere(
        organizationKey(
          'a',
          CanGetOtherOrganizations.id,
          CanUpdateOtherOrganizations.id
        )
      )
    ).toEqual({ OR: [{ enabled: true }, { id: { in: ['a'] } }] });
  });
});

describe('canReadOrganizationSensitiveData', () => {
  it('lets members read their own organisation only', () => {
    expect(canReadOrganizationSensitiveData(user(['a']), 'a')).toBe(true);
    expect(canReadOrganizationSensitiveData(user(['a']), 'b')).toBe(false);
  });

  it('lets whoever may read any organisation read it', () => {
    expect(
      canReadOrganizationSensitiveData(
        user([], CanGetOtherOrganizations.id),
        'a'
      )
    ).toBe(true);
    expect(
      canReadOrganizationSensitiveData(apiKey(CanGetOtherOrganizations.id), 'a')
    ).toBe(true);
    expect(
      canReadOrganizationSensitiveData(peer(CanGetOtherOrganizations.id), 'a')
    ).toBe(true);
  });

  it('lets whoever may update any organisation read it, as the update returns it anyway', () => {
    expect(
      canReadOrganizationSensitiveData(
        user([], CanUpdateOtherOrganizations.id),
        'a'
      )
    ).toBe(true);
    expect(
      canReadOrganizationSensitiveData(
        apiKey(CanUpdateOtherOrganizations.id),
        'a'
      )
    ).toBe(true);
  });

  it('refuses an api key without a cross-organisation permission', () => {
    expect(canReadOrganizationSensitiveData(apiKey(), 'a')).toBe(false);
    expect(
      canReadOrganizationSensitiveData(apiKey(CanUpdateOrganization.id), 'a')
    ).toBe(false);
    expect(
      canReadOrganizationSensitiveData(
        apiKey(CanGetOtherOrganizationEvents.id),
        'a'
      )
    ).toBe(false);
  });

  it('lets an api key read its own organisation only, whatever its scopes', () => {
    expect(canReadOrganizationSensitiveData(organizationKey('a'), 'a')).toBe(
      true
    );
    expect(
      canReadOrganizationSensitiveData(
        organizationKey('a', CanGetOtherOrganizations.id),
        'b'
      )
    ).toBe(false);
  });

  it('refuses anonymous callers and a missing organisation', () => {
    expect(canReadOrganizationSensitiveData(undefined, 'a')).toBe(false);
    expect(canReadOrganizationSensitiveData(null, 'a')).toBe(false);
    expect(canReadOrganizationSensitiveData(user(['a']), undefined)).toBe(
      false
    );
  });
});

describe('memberOrganizationsWhere', () => {
  it('matches the organisations of a member', () => {
    expect(memberOrganizationsWhere(user(['a']))).toEqual({
      id: { in: ['a'] },
    });
  });

  it('matches nothing for anonymous callers and platform api keys', () => {
    expect(memberOrganizationsWhere(undefined)).toEqual({ id: { in: [] } });
    expect(
      memberOrganizationsWhere(apiKey(CanUpdateOtherOrganizations.id))
    ).toEqual({ id: { in: [] } });
  });

  it('matches the organisation of an api key bound to one', () => {
    expect(memberOrganizationsWhere(organizationKey('a'))).toEqual({
      id: { in: ['a'] },
    });
  });
});

describe('canManageOrganization', () => {
  it('lets members manage their organisation', () => {
    expect(canManageOrganization(user(['a']), 'a')).toBe(true);
    expect(canManageOrganization(user(['a']), 'b')).toBe(false);
  });

  it('lets whoever may update any organisation manage it', () => {
    expect(
      canManageOrganization(user([], CanUpdateOtherOrganizations.id), 'a')
    ).toBe(true);
    expect(
      canManageOrganization(apiKey(CanUpdateOtherOrganizations.id), 'a')
    ).toBe(true);
  });

  it('does not let an api key manage organisations through CAN_UPDATE_ORGANIZATION alone', () => {
    expect(canManageOrganization(apiKey(CanUpdateOrganization.id), 'a')).toBe(
      false
    );
  });

  it('does not let anonymous callers manage anything', () => {
    expect(canManageOrganization(undefined, 'a')).toBe(false);
  });

  it('lets an api key manage its own organisation and no other', () => {
    expect(canManageOrganization(organizationKey('a'), 'a')).toBe(true);
    expect(
      canManageOrganization(
        organizationKey('a', CanUpdateOtherOrganizations.id),
        'b'
      )
    ).toBe(false);
  });
});

const as = (
  userId: string,
  organizationIds: string[],
  ...permissionIDs: string[]
): AuthSession => {
  const session = user(organizationIds, ...permissionIDs) as UserSession;

  return { ...session, user: { ...session.user, id: userId } };
};

const submitter = 'user-submitter';
const somebodyElse = 'user-somebody-else';

const sessions: Record<string, AuthSession | null | undefined> = {
  anonymous: undefined,
  'no session': null,
  'the submitter, without organisation': as(submitter, []),
  'the submitter, in an unrelated organisation': as(submitter, ['x']),
  'the submitter, holding CAN_PUBLISH_EVENT': as(
    submitter,
    [],
    CanPublishEvent.id
  ),
  'a stranger without organisation': as('user-stranger', []),
  'a stranger holding CAN_PUBLISH_EVENT': as(
    'user-stranger',
    [],
    CanPublishEvent.id
  ),
  'a member of the organising body': as('user-member', ['a']),
  "a member of the venue's organisation": as('user-venue', ['v']),
  'a cross-organisation reader': as(
    'user-reader',
    [],
    CanGetOtherOrganizationEvents.id
  ),
  'a cross-organisation editor': as(
    'user-editor',
    [],
    CanUpdateOtherOrganizationEvents.id
  ),
  'a peer': peer(),
  'a peer with CAN_UPDATE_OTHER_ORGANIZATION_EVENTS': peer(
    CanUpdateOtherOrganizationEvents.id
  ),
  'an api key': apiKey(),
  'an api key with CAN_UPDATE_OTHER_ORGANIZATION_EVENTS': apiKey(
    CanUpdateOtherOrganizationEvents.id
  ),
  'an api key with CAN_GET_OTHER_ORGANIZATION_EVENTS': apiKey(
    CanGetOtherOrganizationEvents.id
  ),
  'an api key of the organising body': organizationKey('a'),
  "an api key of the venue's organisation": organizationKey('v'),
  'an api key of an unrelated organisation': organizationKey('x'),
  'an api key of the organising body with every cross-organisation permission':
    organizationKey(
      'a',
      CanGetOtherOrganizationEvents.id,
      CanUpdateOtherOrganizationEvents.id
    ),
  'an api key of an unrelated organisation with every cross-organisation permission':
    organizationKey(
      'x',
      CanGetOtherOrganizationEvents.id,
      CanUpdateOtherOrganizationEvents.id
    ),
};

const events: Record<string, EventOwnership> = {
  "the submitter's orphan": {
    organizationId: null,
    ownerId: submitter,
    place: null,
  },
  "somebody else's orphan": {
    organizationId: null,
    ownerId: somebodyElse,
    place: null,
  },
  'an orphan without owner': {
    organizationId: null,
    ownerId: null,
    place: null,
  },
  "the submitter's event at a venue": {
    organizationId: 'a',
    ownerId: submitter,
    place: { organizationId: 'v' },
  },
  "somebody else's event at a venue": {
    organizationId: 'a',
    ownerId: somebodyElse,
    place: { organizationId: 'v' },
  },
};

const eventNames = Object.keys(events);

const matches = (
  where: Prisma.EventWhereInput,
  event: EventOwnership
): boolean => {
  if (where.OR) {
    return (where.OR as Prisma.EventWhereInput[]).some(branch =>
      matches(branch, event)
    );
  }

  if (where.organizationId) {
    const { in: ids } = where.organizationId as { in: string[] };

    return event.organizationId != null && ids.includes(event.organizationId);
  }

  if (where.place) {
    const { organizationId } = where.place as {
      organizationId: { in: string[] };
    };
    const venue = event.place?.organizationId;

    return venue != null && organizationId.in.includes(venue);
  }

  if (where.ownerId !== undefined) {
    return event.ownerId === where.ownerId;
  }

  return true;
};

const allowed = (...names: string[]) =>
  Object.fromEntries(eventNames.map(name => [name, names.includes(name)]));
const none = allowed();
const all = allowed(...eventNames);
const own = [
  "the submitter's orphan",
  "the submitter's event at a venue",
] as const;
const organised = [
  "the submitter's event at a venue",
  "somebody else's event at a venue",
] as const;

describe('editorEventsWhere', () => {
  it('shows anonymous callers nothing', () => {
    expect(editorEventsWhere(undefined)).toEqual({
      organizationId: { in: [] },
    });
    expect(editorEventsWhere(null)).toEqual({
      organizationId: { in: [] },
    });
  });

  it('shows members the events of their organisations and the ones they own', () => {
    expect(editorEventsWhere(user(['a']))).toEqual({
      OR: [{ organizationId: { in: ['a'] } }, { ownerId: 'user-1' }],
    });
  });

  it('shows a user without organisation the events they own', () => {
    expect(editorEventsWhere(user([]))).toEqual({
      OR: [{ organizationId: { in: [] } }, { ownerId: 'user-1' }],
    });
  });

  it('shows everything with CAN_GET_OTHER_ORGANIZATION_EVENTS', () => {
    expect(
      editorEventsWhere(user([], CanGetOtherOrganizationEvents.id))
    ).toEqual({});
    expect(editorEventsWhere(apiKey(CanGetOtherOrganizationEvents.id))).toEqual(
      {}
    );
  });

  it('shows an api key of an organisation that organisation‘s events, and never more', () => {
    expect(editorEventsWhere(organizationKey('a'))).toEqual({
      organizationId: { in: ['a'] },
    });
    expect(
      editorEventsWhere(organizationKey('a', CanGetOtherOrganizationEvents.id))
    ).toEqual({ organizationId: { in: ['a'] } });
  });

  it('shows an api key and a peer without it nothing, as neither owns events', () => {
    expect(editorEventsWhere(apiKey())).toEqual({
      organizationId: { in: [] },
    });
    expect(editorEventsWhere(peer())).toEqual({
      organizationId: { in: [] },
    });
  });

  it.each([
    ['anonymous', none],
    ['no session', none],
    ['the submitter, without organisation', allowed(...own)],
    ['the submitter, in an unrelated organisation', allowed(...own)],
    ['the submitter, holding CAN_PUBLISH_EVENT', allowed(...own)],
    ['a stranger without organisation', none],
    ['a stranger holding CAN_PUBLISH_EVENT', none],
    ['a member of the organising body', allowed(...organised)],
    ["a member of the venue's organisation", none],
    ['a cross-organisation reader', all],
    ['a cross-organisation editor', none],
    ['a peer', none],
    ['a peer with CAN_UPDATE_OTHER_ORGANIZATION_EVENTS', none],
    ['an api key', none],
    ['an api key with CAN_UPDATE_OTHER_ORGANIZATION_EVENTS', none],
    ['an api key with CAN_GET_OTHER_ORGANIZATION_EVENTS', all],
    ['an api key of the organising body', allowed(...organised)],
    ["an api key of the venue's organisation", none],
    ['an api key of an unrelated organisation', none],
    [
      'an api key of the organising body with every cross-organisation permission',
      allowed(...organised),
    ],
    [
      'an api key of an unrelated organisation with every cross-organisation permission',
      none,
    ],
  ])('lists for %s', (sessionName, expected) => {
    const where = editorEventsWhere(sessions[sessionName]);

    expect(
      Object.fromEntries(
        eventNames.map(name => [name, matches(where, events[name])])
      )
    ).toEqual(expected);
  });
});

describe('canModifyEvent', () => {
  const event = (
    organizationId: string | null,
    placeOrganizationId?: string | null,
    ownerId: string | null = null
  ): EventOwnership => ({
    organizationId,
    ownerId,
    place:
      placeOrganizationId === undefined ? null : (
        { organizationId: placeOrganizationId }
      ),
  });

  it('lets members of the organising body modify it', () => {
    expect(canModifyEvent(user(['a']), event('a'))).toBe(true);
  });

  it("lets members of the venue's organisation modify it", () => {
    expect(canModifyEvent(user(['v']), event('a', 'v'))).toBe(true);
  });

  it('refuses everyone else', () => {
    expect(canModifyEvent(user(['x']), event('a', 'v'))).toBe(false);
    expect(canModifyEvent(user(['x']), event('a', null))).toBe(false);
  });

  it('refuses members on an event without organisation or venue', () => {
    expect(canModifyEvent(user(['a']), event(null))).toBe(false);
  });

  it("still lets the venue's organisation modify an event without organisation", () => {
    expect(canModifyEvent(user(['v']), event(null, 'v'))).toBe(true);
  });

  it('lets the owner modify their event without belonging to any organisation', () => {
    expect(canModifyEvent(user([]), event(null, undefined, 'user-1'))).toBe(
      true
    );
    expect(canModifyEvent(user([]), event('a', 'v', 'user-1'))).toBe(true);
  });

  it("does not let an api key of an organisation modify another organisation's event, whatever its scopes", () => {
    expect(
      canModifyEvent(
        organizationKey('x', CanUpdateOtherOrganizationEvents.id),
        event('a', 'v')
      )
    ).toBe(false);
  });

  it("does not let a token whose id equals the owner's modify it", () => {
    expect(canModifyEvent(apiKey(), event(null, undefined, 'key-1'))).toBe(
      false
    );
    expect(canModifyEvent(peer(), event(null, undefined, 'peer-1'))).toBe(
      false
    );
  });

  it('lets CAN_UPDATE_OTHER_ORGANIZATION_EVENTS modify any event', () => {
    expect(
      canModifyEvent(user([], CanUpdateOtherOrganizationEvents.id), event('a'))
    ).toBe(true);
    expect(
      canModifyEvent(apiKey(CanUpdateOtherOrganizationEvents.id), event('a'))
    ).toBe(true);
  });

  it('does not turn reading other organisations into modifying them', () => {
    expect(
      canModifyEvent(user([], CanGetOtherOrganizationEvents.id), event('a'))
    ).toBe(false);
  });

  it('refuses an api key without the permission and anonymous callers', () => {
    expect(canModifyEvent(apiKey(), event('a'))).toBe(false);
    expect(canModifyEvent(undefined, event('a'))).toBe(false);
  });

  it('lists the organising body only but lets the venue modify, on purpose', () => {
    const venueMember = user(['v']);
    const venueEvent = event('a', 'v');

    expect(canModifyEvent(venueMember, venueEvent)).toBe(true);
    expect(matches(editorEventsWhere(venueMember), venueEvent)).toBe(false);
  });

  it.each([
    ['anonymous', none],
    ['no session', none],
    ['the submitter, without organisation', allowed(...own)],
    ['the submitter, in an unrelated organisation', allowed(...own)],
    ['the submitter, holding CAN_PUBLISH_EVENT', allowed(...own)],
    ['a stranger without organisation', none],
    ['a stranger holding CAN_PUBLISH_EVENT', none],
    ['a member of the organising body', allowed(...organised)],
    ["a member of the venue's organisation", allowed(...organised)],
    ['a cross-organisation reader', none],
    ['a cross-organisation editor', all],
    ['a peer', none],
    ['a peer with CAN_UPDATE_OTHER_ORGANIZATION_EVENTS', all],
    ['an api key', none],
    ['an api key with CAN_UPDATE_OTHER_ORGANIZATION_EVENTS', all],
    ['an api key with CAN_GET_OTHER_ORGANIZATION_EVENTS', none],
    ['an api key of the organising body', allowed(...organised)],
    ["an api key of the venue's organisation", allowed(...organised)],
    ['an api key of an unrelated organisation', none],
    [
      'an api key of the organising body with every cross-organisation permission',
      allowed(...organised),
    ],
    [
      'an api key of an unrelated organisation with every cross-organisation permission',
      none,
    ],
  ])('lets %s modify', (sessionName, expected) => {
    expect(
      Object.fromEntries(
        eventNames.map(name => [
          name,
          canModifyEvent(sessions[sessionName], events[name]),
        ])
      )
    ).toEqual(expected);
  });

  it.each(['draft', 'review requested', 'pending', 'published', 'validated'])(
    'keeps the owner in once the event is %s, and gives a non-owner nothing from it',
    state => {
      const ownEvent: EventOwnership & { state: string } = {
        ...events["the submitter's orphan"],
        state,
      };

      expect(
        canModifyEvent(
          sessions['the submitter, without organisation'],
          ownEvent
        )
      ).toBe(true);
      expect(
        canModifyEvent(sessions['a stranger without organisation'], ownEvent)
      ).toBe(false);
    }
  );
});

describe('publicEventsWhere', () => {
  it('matches the events with a published revision', () => {
    expect(publicEventsWhere()).toEqual({ published: { isNot: null } });
  });
});

describe('reachableEventsWhere', () => {
  it.each([
    ['anonymous', none],
    ['the submitter, without organisation', allowed(...own)],
    ['a stranger without organisation', none],
    ['a member of the organising body', allowed(...organised)],
    ["a member of the venue's organisation", allowed(...organised)],
    ['a cross-organisation reader', all],
    ['a cross-organisation editor', all],
    ['a peer', none],
    ['an api key', none],
    ['an api key with CAN_GET_OTHER_ORGANIZATION_EVENTS', all],
    ["an api key of the venue's organisation", allowed(...organised)],
    [
      'an api key of an unrelated organisation with every cross-organisation permission',
      none,
    ],
  ])('lets %s open', (sessionName, expected) => {
    const where = reachableEventsWhere(sessions[sessionName]);

    expect(
      Object.fromEntries(
        eventNames.map(name => [name, matches(where, events[name])])
      )
    ).toEqual(expected);
  });

  it('opens whatever the list shows or canModifyEvent accepts, and nothing else', () => {
    for (const session of Object.values(sessions)) {
      for (const event of Object.values(events)) {
        expect(matches(reachableEventsWhere(session), event)).toBe(
          matches(editorEventsWhere(session), event) ||
            canModifyEvent(session, event)
        );
      }
    }
  });
});

describe('canPublishEvent', () => {
  const publishing: Record<string, AuthSession | null | undefined> = {
    anonymous: undefined,
    'the owner without CAN_PUBLISH_EVENT': as(submitter, []),
    'the owner with CAN_PUBLISH_EVENT': as(submitter, [], CanPublishEvent.id),
    'a member without CAN_PUBLISH_EVENT': as('user-member', ['a']),
    'a member with CAN_PUBLISH_EVENT': as(
      'user-member',
      ['a'],
      CanPublishEvent.id
    ),
    'a venue member with CAN_PUBLISH_EVENT': as(
      'user-venue',
      ['v'],
      CanPublishEvent.id
    ),
    'a validator': as(
      'user-validator',
      [],
      CanPublishEvent.id,
      CanUpdateOtherOrganizationEvents.id
    ),
    'a peer validator': peer(
      CanPublishEvent.id,
      CanUpdateOtherOrganizationEvents.id
    ),
    'a platform key validator': apiKey(
      CanPublishEvent.id,
      CanUpdateOtherOrganizationEvents.id
    ),
    'a key of the organising body with CAN_PUBLISH_EVENT': organizationKey(
      'a',
      CanPublishEvent.id
    ),
    "a key of the venue's organisation with every permission": organizationKey(
      'v',
      CanPublishEvent.id,
      CanUpdateOtherOrganizationEvents.id
    ),
  };

  it.each([
    ['anonymous', none],
    ['the owner without CAN_PUBLISH_EVENT', none],
    ['the owner with CAN_PUBLISH_EVENT', allowed("the submitter's orphan")],
    ['a member without CAN_PUBLISH_EVENT', none],
    ['a member with CAN_PUBLISH_EVENT', allowed(...organised)],
    ['a venue member with CAN_PUBLISH_EVENT', none],
    ['a validator', all],
    ['a peer validator', all],
    ['a platform key validator', all],
    [
      'a key of the organising body with CAN_PUBLISH_EVENT',
      allowed(...organised),
    ],
    ["a key of the venue's organisation with every permission", none],
  ])('lets %s publish', (sessionName, expected) => {
    expect(
      Object.fromEntries(
        eventNames.map(name => [
          name,
          canPublishEvent(publishing[sessionName], events[name]),
        ])
      )
    ).toEqual(expected);
  });
});

describe('canDeleteEvent', () => {
  const deleting: Record<string, AuthSession | null | undefined> = {
    ...sessions,
    'a cross-organisation deleter': as(
      'user-deleter',
      [],
      CanDeleteOtherOrganizationEvents.id
    ),
    'a peer with CAN_DELETE_OTHER_ORGANIZATION_EVENTS': peer(
      CanDeleteOtherOrganizationEvents.id
    ),
    'a platform key with CAN_DELETE_OTHER_ORGANIZATION_EVENTS': apiKey(
      CanDeleteOtherOrganizationEvents.id
    ),
    'a key of an unrelated organisation with CAN_DELETE_OTHER_ORGANIZATION_EVENTS':
      organizationKey('x', CanDeleteOtherOrganizationEvents.id),
  };

  it.each([
    ['anonymous', none],
    ['the submitter, without organisation', none],
    ['a member of the organising body', allowed(...organised)],
    ["a member of the venue's organisation", none],
    ['a cross-organisation editor', none],
    ['a cross-organisation deleter', all],
    ['a peer', none],
    ['a peer with CAN_DELETE_OTHER_ORGANIZATION_EVENTS', all],
    ['a platform key with CAN_DELETE_OTHER_ORGANIZATION_EVENTS', all],
    ['an api key of the organising body', allowed(...organised)],
    ["an api key of the venue's organisation", none],
    [
      'a key of an unrelated organisation with CAN_DELETE_OTHER_ORGANIZATION_EVENTS',
      none,
    ],
  ])('lets %s delete', (sessionName, expected) => {
    expect(
      Object.fromEntries(
        eventNames.map(name => [
          name,
          canDeleteEvent(deleting[sessionName], events[name]),
        ])
      )
    ).toEqual(expected);
  });
});

describe('mayAssignEventOrganization', () => {
  it('lets members assign their own organisation and nobody else', () => {
    expect(mayAssignEventOrganization(user(['a']), 'a')).toBe(true);
    expect(mayAssignEventOrganization(user(['a']), 'b')).toBe(false);
    expect(mayAssignEventOrganization(user([]), 'a')).toBe(false);
  });

  it('lets anybody leave the organisation empty', () => {
    expect(mayAssignEventOrganization(user([]), null)).toBe(true);
  });

  it('lets CAN_UPDATE_OTHER_ORGANIZATION_EVENTS assign any organisation', () => {
    expect(
      mayAssignEventOrganization(
        user([], CanUpdateOtherOrganizationEvents.id),
        'b'
      )
    ).toBe(true);
    expect(
      mayAssignEventOrganization(
        apiKey(CanUpdateOtherOrganizationEvents.id),
        'b'
      )
    ).toBe(true);
  });

  it('keeps an api key of an organisation to it, whatever its scopes', () => {
    expect(mayAssignEventOrganization(organizationKey('a'), 'a')).toBe(true);
    expect(
      mayAssignEventOrganization(
        organizationKey('a', CanUpdateOtherOrganizationEvents.id),
        'b'
      )
    ).toBe(false);
  });
});

describe('mayAssignEventOwner', () => {
  it('lets a user make themselves the owner', () => {
    expect(mayAssignEventOwner(user([]), 'user-1')).toBe(true);
  });

  it('refuses handing the event to somebody else, or to nobody', () => {
    expect(mayAssignEventOwner(user(['a']), 'user-2')).toBe(false);
    expect(mayAssignEventOwner(user(['a']), null)).toBe(false);
    expect(mayAssignEventOwner(apiKey(), 'user-2')).toBe(false);
  });

  it('lets CAN_UPDATE_OTHER_ORGANIZATION_EVENTS assign any owner', () => {
    expect(
      mayAssignEventOwner(user([], CanUpdateOtherOrganizationEvents.id), null)
    ).toBe(true);
    expect(
      mayAssignEventOwner(
        user([], CanUpdateOtherOrganizationEvents.id),
        'user-2'
      )
    ).toBe(true);
  });

  it('never lets an api key of an organisation assign an owner', () => {
    expect(
      mayAssignEventOwner(
        organizationKey('a', CanUpdateOtherOrganizationEvents.id),
        'user-2'
      )
    ).toBe(false);
  });
});

describe('mayMoveEventToOrganization', () => {
  const organised: EventOwnership = {
    organizationId: 'a',
    ownerId: 'user-1',
    place: { organizationId: 'v' },
  };
  const orphan: EventOwnership = {
    organizationId: null,
    ownerId: 'user-1',
    place: null,
  };

  it('lets a member move the event to another organisation of theirs', () => {
    expect(mayMoveEventToOrganization(user(['a', 'b']), organised, 'b')).toBe(
      true
    );
  });

  it('refuses moving it into an organisation the actor does not belong to', () => {
    expect(mayMoveEventToOrganization(user(['a']), organised, 'b')).toBe(false);
  });

  it("refuses the venue's organisation adopting the event", () => {
    expect(
      mayMoveEventToOrganization(as('user-v', ['v']), organised, 'v')
    ).toBe(false);
  });

  it('lets the owner of an orphan put it into their organisation, and nowhere else', () => {
    expect(mayMoveEventToOrganization(user(['b']), orphan, 'b')).toBe(true);
    expect(mayMoveEventToOrganization(user([]), orphan, 'b')).toBe(false);
  });

  it('refuses an owner moving an organisation event they are not a member of', () => {
    expect(mayMoveEventToOrganization(user([]), organised, null)).toBe(false);
  });

  it('lets CAN_UPDATE_OTHER_ORGANIZATION_EVENTS move anything anywhere', () => {
    expect(
      mayMoveEventToOrganization(
        user([], CanUpdateOtherOrganizationEvents.id),
        organised,
        'b'
      )
    ).toBe(true);
  });

  it('keeps an api key of an organisation inside it', () => {
    expect(
      mayMoveEventToOrganization(
        organizationKey('a', CanUpdateOtherOrganizationEvents.id),
        organised,
        'b'
      )
    ).toBe(false);
  });
});

describe('mayReassignEventOwner', () => {
  it('is CAN_UPDATE_OTHER_ORGANIZATION_EVENTS only, even for taking an event over', () => {
    expect(mayReassignEventOwner(user(['a']))).toBe(false);
    expect(
      mayReassignEventOwner(user([], CanUpdateOtherOrganizationEvents.id))
    ).toBe(true);
    expect(
      mayReassignEventOwner(
        organizationKey('a', CanUpdateOtherOrganizationEvents.id)
      )
    ).toBe(false);
  });
});

describe('boundOrganizationIdOf', () => {
  it('is the organisation of a bound api key, and nothing for anyone else', () => {
    expect(boundOrganizationIdOf(organizationKey('a'))).toBe('a');
    expect(boundOrganizationIdOf(apiKey())).toBeNull();
    expect(boundOrganizationIdOf(user(['a']))).toBeNull();
    expect(boundOrganizationIdOf(undefined)).toBeNull();
  });
});

describe('visiblePlacesWhere', () => {
  it.each([
    ['nobody', undefined, { enabled: true }],
    ['a user without membership', user([]), { enabled: true }],
    ['a peer', peer(), { enabled: true }],
    ['a platform key', apiKey(), { enabled: true }],
    [
      'a member',
      user(['a']),
      { OR: [{ enabled: true }, { organizationId: { in: ['a'] } }] },
    ],
    [
      'a bound key, whatever its scopes',
      organizationKey('a', CanGetOtherOrganizations.id),
      { OR: [{ enabled: true }, { organizationId: { in: ['a'] } }] },
    ],
    ['CAN_GET_OTHER_ORGANIZATIONS', user([], CanGetOtherOrganizations.id), {}],
    [
      'CAN_UPDATE_OTHER_ORGANIZATIONS',
      user([], CanUpdateOtherOrganizations.id),
      {},
    ],
    [
      'a peer with CAN_GET_OTHER_ORGANIZATIONS',
      peer(CanGetOtherOrganizations.id),
      {},
    ],
    [
      'a platform key with CAN_GET_OTHER_ORGANIZATIONS',
      apiKey(CanGetOtherOrganizations.id),
      {},
    ],
  ] as const)('%s', (_name, session, where) => {
    expect(visiblePlacesWhere(session)).toEqual(where);
  });
});

describe('selectablePlacesWhere', () => {
  it.each([
    ['nobody', undefined, { enabled: true, private: false }],
    ['a user without membership', user([]), { enabled: true, private: false }],
    ['a peer', peer(), { enabled: true, private: false }],
    [
      'a platform key without cross-organisation scopes',
      apiKey(CanGetOtherOrganizations.id),
      { enabled: true, private: false },
    ],
    [
      'a member, who also picks the private places of their organisation',
      user(['a']),
      {
        enabled: true,
        OR: [{ private: false }, { organizationId: { in: ['a'] } }],
      },
    ],
    [
      'a bound key with cross-organisation scopes',
      organizationKey('a', CanUpdateOtherOrganizationEvents.id),
      {
        enabled: true,
        OR: [{ private: false }, { organizationId: { in: ['a'] } }],
      },
    ],
    [
      'CAN_UPDATE_OTHER_ORGANIZATION_EVENTS, who files events at any enabled place',
      user([], CanUpdateOtherOrganizationEvents.id),
      { enabled: true },
    ],
    [
      'a platform key with CAN_UPDATE_OTHER_ORGANIZATION_EVENTS',
      apiKey(CanUpdateOtherOrganizationEvents.id),
      { enabled: true },
    ],
  ] as const)('%s', (_name, session, where) => {
    expect(selectablePlacesWhere(session)).toEqual(where);
  });
});

describe('canManagePlace', () => {
  it.each([
    ['nobody', undefined, 'a', false],
    ['a member of the place organisation', user(['a']), 'a', true],
    ['a member of another organisation', user(['b']), 'a', false],
    ['a bound key of the place organisation', organizationKey('a'), 'a', true],
    [
      'a bound key of another organisation, whatever its scopes',
      organizationKey('b', CanUpdateOtherOrganizations.id),
      'a',
      false,
    ],
    ['a peer', peer(), 'a', false],
    ['a platform key', apiKey(), 'a', false],
    [
      'CAN_UPDATE_OTHER_ORGANIZATIONS',
      user([], CanUpdateOtherOrganizations.id),
      'a',
      true,
    ],
    [
      'a peer with CAN_UPDATE_OTHER_ORGANIZATIONS',
      peer(CanUpdateOtherOrganizations.id),
      'a',
      true,
    ],
    [
      'CAN_GET_OTHER_ORGANIZATIONS, which only reads',
      user([], CanGetOtherOrganizations.id),
      'a',
      false,
    ],
    ['a member, for a place without organisation', user(['a']), null, false],
    [
      'a bound key, for a place without organisation',
      organizationKey('a'),
      null,
      false,
    ],
    [
      'CAN_UPDATE_OTHER_ORGANIZATIONS, for a place without organisation',
      user([], CanUpdateOtherOrganizations.id),
      null,
      true,
    ],
  ] as const)('%s', (_name, session, organizationId, allowed) => {
    expect(canManagePlace(session, organizationId)).toBe(allowed);
  });
});

describe('canSeeOrganization', () => {
  const enabled = { id: 'a', enabled: true };
  const disabled = { id: 'a', enabled: false };

  it('shows an enabled organisation to everybody', () => {
    expect(canSeeOrganization(undefined, enabled)).toBe(true);
    expect(canSeeOrganization(peer(), enabled)).toBe(true);
  });

  it.each([
    ['nobody', undefined, false],
    ['a peer', peer(), false],
    ['a member of another organisation', user(['b']), false],
    ['a member', user(['a']), true],
    ['a bound key of the organisation', organizationKey('a'), true],
    [
      'a bound key of another organisation, whatever its scopes',
      organizationKey('b', CanGetOtherOrganizations.id),
      false,
    ],
    [
      'CAN_GET_OTHER_ORGANIZATIONS',
      user([], CanGetOtherOrganizations.id),
      true,
    ],
  ] as const)('a disabled organisation: %s', (_name, session, visible) => {
    expect(canSeeOrganization(session, disabled)).toBe(visible);
  });
});
