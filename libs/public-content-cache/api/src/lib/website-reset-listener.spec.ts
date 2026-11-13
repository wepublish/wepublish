import { Test, type TestingModule } from '@nestjs/testing';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import {
  NamespaceResets,
  NamespaceVersions,
} from '@wepublish/kv-ttl-cache/api';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import { WEBSITE_PAGES_VERSION } from '@wepublish/website-revalidation/api';
import { PublicContentCacheModule } from './public-content-cache.module';

const changesOf = (dragonfly: FakeDragonfly, key: string) => () =>
  dragonfly.commands.filter(
    command =>
      command[0] === 'SET' && command[1] === key && !command.includes('NX')
  ).length;

const read = async (dragonfly: FakeDragonfly, key: string) => {
  const reply = await dragonfly.get(key);

  return reply.ok ? reply.value : undefined;
};

describe('WebsiteResetListener', () => {
  const modules: TestingModule[] = [];

  const start = async (dragonfly: FakeDragonfly) => {
    const module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot({ connection: dragonfly }),
        PublicContentCacheModule,
      ],
    }).compile();
    await module.init();
    modules.push(module);

    return {
      resets: module.get(NamespaceResets),
      versions: module.get(NamespaceVersions),
    };
  };

  afterEach(async () => {
    await Promise.all(modules.splice(0).map(module => module.close()));
    vi.useRealTimers();
  });

  describe('website pages version', () => {
    it.each([
      'graphql:content',
      'navigations',
      'content:engagement',
      'settings',
      'website-settings',
      'peer-profile',
      'member-plans',
      'peering:remote-profiles',
    ])('changes four seconds after %s is reset', async namespace => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const { resets, versions } = await start(dragonfly);
      const before = await versions.current(WEBSITE_PAGES_VERSION);

      await resets.reset(namespace);
      await vi.advanceTimersByTimeAsync(3999);

      await expect(read(dragonfly, 'nsv:website:pages')).resolves.toBe(before);

      await vi.advanceTimersByTimeAsync(1);

      await expect(read(dragonfly, 'nsv:website:pages')).resolves.not.toBe(
        before
      );
    });

    it.each(['content:articles', 'auth:sessions', 'graphql:comments'])(
      'stays the same when %s is reset',
      async namespace => {
        vi.useFakeTimers();
        const dragonfly = new FakeDragonfly();
        const { resets, versions } = await start(dragonfly);
        const before = await versions.current(WEBSITE_PAGES_VERSION);

        await resets.reset(namespace);
        await vi.advanceTimersByTimeAsync(70_000);

        await expect(read(dragonfly, 'nsv:website:pages')).resolves.toBe(
          before
        );
      }
    );

    it('stays the same when the reset is told to leave the websites alone', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const changes = changesOf(dragonfly, 'nsv:website:pages');
      const { resets } = await start(dragonfly);

      await resets.reset('graphql:content', { silent: true });
      await vi.advanceTimersByTimeAsync(70_000);

      expect(changes()).toBe(0);
    });
  });

  describe('website layout version', () => {
    it.each([
      'navigations',
      'content:engagement',
      'settings',
      'website-settings',
      'peer-profile',
      'member-plans',
      'peering:remote-profiles',
      'content:paywalls',
    ])(
      'changes at once and again six seconds after %s is reset',
      async namespace => {
        vi.useFakeTimers();
        const dragonfly = new FakeDragonfly();
        const changes = changesOf(dragonfly, 'nsv:website:layout');
        const { resets } = await start(dragonfly);

        await resets.reset(namespace);

        expect(changes()).toBe(1);

        await vi.advanceTimersByTimeAsync(5999);

        expect(changes()).toBe(1);

        await vi.advanceTimersByTimeAsync(1);

        expect(changes()).toBe(2);
      }
    );

    it.each(['graphql:content', 'content:articles', 'auth:sessions'])(
      'stays the same when %s is reset',
      async namespace => {
        vi.useFakeTimers();
        const dragonfly = new FakeDragonfly();
        const changes = changesOf(dragonfly, 'nsv:website:layout');
        const { resets } = await start(dragonfly);

        await resets.reset(namespace);
        await vi.advanceTimersByTimeAsync(70_000);

        expect(changes()).toBe(0);
      }
    );

    it('stays the same when the reset is told to leave the websites alone', async () => {
      vi.useFakeTimers();
      const dragonfly = new FakeDragonfly();
      const changes = changesOf(dragonfly, 'nsv:website:layout');
      const { resets } = await start(dragonfly);

      await resets.reset('navigations', { silent: true });
      await vi.advanceTimersByTimeAsync(70_000);

      expect(changes()).toBe(0);
    });
  });
});
