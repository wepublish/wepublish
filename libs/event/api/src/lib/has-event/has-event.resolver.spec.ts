import { CanGetEvent } from '@wepublish/permissions';
import {
  HasEventLcResolver,
  HasEventResolver,
  HasOptionalEventLcResolver,
  HasOptionalEventResolver,
} from './has-event.resolver';

const event = { id: 'event-1' };

const editorRequest = {
  headers: { preview: 'true' },
  user: { roles: [{ id: 'r', permissionIDs: [CanGetEvent.id] }] },
};

const setup = (revisions: object) => {
  const events = { load: vi.fn(async () => event) };
  const revisionLoader = { load: vi.fn(async () => revisions) };

  return { events, revisionLoader };
};

describe('HasOptionalEvent resolvers', () => {
  it.each([HasOptionalEventResolver, HasOptionalEventLcResolver])(
    '%o resolves a published event for the public',
    async Resolver => {
      const { events, revisionLoader } = setup({ published: { id: 'rev' } });
      const resolver = new Resolver(events as any, revisionLoader as any);

      await expect(
        resolver.event({ eventId: 'event-1' }, { req: {} })
      ).resolves.toBe(event);
    }
  );

  it.each([HasOptionalEventResolver, HasOptionalEventLcResolver])(
    '%o resolves an unpublished event to null for the public',
    async Resolver => {
      const { events, revisionLoader } = setup({ draft: { id: 'rev' } });
      const resolver = new Resolver(events as any, revisionLoader as any);

      await expect(
        resolver.event({ eventID: 'event-1' }, { req: { headers: {} } })
      ).resolves.toBeNull();
    }
  );

  it('resolves an unpublished event in editor mode', async () => {
    const { events, revisionLoader } = setup({ draft: { id: 'rev' } });
    const resolver = new HasOptionalEventResolver(
      events as any,
      revisionLoader as any
    );

    await expect(
      resolver.event({ eventId: 'event-1' }, { req: editorRequest })
    ).resolves.toBe(event);
  });

  it('resolves nothing without an id', async () => {
    const { events, revisionLoader } = setup({});
    const resolver = new HasOptionalEventResolver(
      events as any,
      revisionLoader as any
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
