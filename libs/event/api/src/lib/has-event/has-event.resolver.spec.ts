import { AuthSessionType } from '@wepublish/authentication/api';
import { CanGetEvent } from '@wepublish/permissions';
import {
  HasEventLcResolver,
  HasEventResolver,
  HasOptionalEventLcResolver,
  HasOptionalEventResolver,
} from './has-event.resolver';

const event = {
  id: 'event-1',
  organizationId: 'org-a',
  ownerId: 'owner-1',
  placeId: 'place-1',
};

const editorSession = (userId: string, organizationIds: string[]) => ({
  type: AuthSessionType.User,
  user: { id: userId },
  roles: [{ id: 'r', permissionIDs: [CanGetEvent.id] }],
  organizationIds,
});

const editorRequest = {
  headers: { preview: 'true' },
  user: editorSession('editor', ['org-a']),
};

const setup = (revisions: object) => {
  const events = { load: vi.fn(async () => event) };
  const revisionLoader = { load: vi.fn(async () => revisions) };
  const places = {
    load: vi.fn(async () => ({ id: 'place-1', organizationId: 'org-venue' })),
  };

  return { events, revisionLoader, places };
};

describe('HasOptionalEvent resolvers', () => {
  it.each([HasOptionalEventResolver, HasOptionalEventLcResolver])(
    '%o resolves a published event for the public',
    async Resolver => {
      const { events, revisionLoader, places } = setup({
        published: { id: 'rev' },
      });
      const resolver = new Resolver(
        events as any,
        revisionLoader as any,
        places as any
      );

      await expect(
        resolver.event({ eventId: 'event-1' }, { req: {} })
      ).resolves.toBe(event);
    }
  );

  it.each([HasOptionalEventResolver, HasOptionalEventLcResolver])(
    '%o resolves an unpublished event to null for the public',
    async Resolver => {
      const { events, revisionLoader, places } = setup({
        draft: { id: 'rev' },
      });
      const resolver = new Resolver(
        events as any,
        revisionLoader as any,
        places as any
      );

      await expect(
        resolver.event({ eventID: 'event-1' }, { req: { headers: {} } })
      ).resolves.toBeNull();
    }
  );

  it('resolves an unpublished event in editor mode', async () => {
    const { events, revisionLoader, places } = setup({
      draft: { id: 'rev' },
    });
    const resolver = new HasOptionalEventResolver(
      events as any,
      revisionLoader as any,
      places as any
    );

    await expect(
      resolver.event({ eventId: 'event-1' }, { req: editorRequest })
    ).resolves.toBe(event);
  });

  it.each([
    ['a member of another organisation', editorSession('foreign', ['org-b'])],
    [
      'an api key bound to another organisation',
      {
        type: AuthSessionType.ApiToken,
        permissions: [CanGetEvent.id],
        organizationId: 'org-b',
      },
    ],
  ])(
    'resolves an unpublished event to null in editor mode for %s',
    async (_name, user) => {
      const { events, revisionLoader, places } = setup({
        draft: { id: 'rev' },
      });
      const resolver = new HasOptionalEventResolver(
        events as any,
        revisionLoader as any,
        places as any
      );

      await expect(
        resolver.event(
          { eventId: 'event-1' },
          { req: { headers: { preview: 'true' }, user } }
        )
      ).resolves.toBeNull();
    }
  );

  it.each([
    ['the owner', editorSession('owner-1', [])],
    ["a member of the venue's organisation", editorSession('v', ['org-venue'])],
  ])(
    'resolves an unpublished event in editor mode for %s',
    async (_name, user) => {
      const { events, revisionLoader, places } = setup({
        draft: { id: 'rev' },
      });
      const resolver = new HasOptionalEventResolver(
        events as any,
        revisionLoader as any,
        places as any
      );

      await expect(
        resolver.event(
          { eventId: 'event-1' },
          { req: { headers: { preview: 'true' }, user } }
        )
      ).resolves.toBe(event);
    }
  );

  it('still resolves a published event in editor mode for a foreign organisation', async () => {
    const { events, revisionLoader, places } = setup({
      published: { id: 'rev' },
    });
    const resolver = new HasOptionalEventResolver(
      events as any,
      revisionLoader as any,
      places as any
    );

    await expect(
      resolver.event(
        { eventId: 'event-1' },
        {
          req: {
            headers: { preview: 'true' },
            user: editorSession('foreign', ['org-b']),
          },
        }
      )
    ).resolves.toBe(event);
  });

  it('resolves nothing without an id', async () => {
    const { events, revisionLoader, places } = setup({});
    const resolver = new HasOptionalEventResolver(
      events as any,
      revisionLoader as any,
      places as any
    );

    await expect(resolver.event({}, { req: {} })).resolves.toBeNull();
  });
});

describe('HasEvent resolvers', () => {
  it.each([HasEventResolver, HasEventLcResolver])(
    '%o keeps resolving unpublished events, as their callers are already scoped',
    async Resolver => {
      const { events, revisionLoader } = setup({ draft: { id: 'rev' } });
      const resolver = new Resolver(events as any);

      await expect(resolver.event({ eventId: 'event-1' })).resolves.toBe(event);
      expect(revisionLoader.load).not.toHaveBeenCalled();
    }
  );
});
