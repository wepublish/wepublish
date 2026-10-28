import { afterEach, describe, expect, it, vi } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  DragonflyTestingModule,
  FakeDragonfly,
} from '@wepublish/dragonfly/api/testing';
import { KvCacheModule } from '@wepublish/kv-ttl-cache/api';
import {
  GENERATION_CHECK_MS,
  LINK_TTL,
  LinkCache,
  MISSING_LINK_TTL,
  REJECTED_VARIANT_TTL,
} from './link-cache';
import { MediaLinkCacheModule } from './media-link-cache.module';

const link = { uri: 'images/1', exists: true };
const missing = { uri: 'images/fallback/{}', exists: false };

describe('LinkCache', () => {
  const modules: TestingModule[] = [];

  const replica = async (dragonfly: FakeDragonfly, releaseId = 'release-1') => {
    const module = await Test.createTestingModule({
      imports: [
        DragonflyTestingModule.forRoot({ connection: dragonfly, releaseId }),
        KvCacheModule.forRoot(),
        MediaLinkCacheModule,
      ],
    }).compile();

    modules.push(module);

    return module.get(LinkCache);
  };

  const valueWrites = (dragonfly: FakeDragonfly) =>
    dragonfly.commands
      .filter(([command, key]) => command === 'SET' && key.startsWith('val:'))
      .map(([, key]) => key);

  afterEach(async () => {
    vi.useRealTimers();
    await Promise.all(modules.splice(0).map(module => module.close()));
  });

  it('serves a link that another replica stored', async () => {
    const dragonfly = new FakeDragonfly();

    await (await replica(dragonfly)).set('image', 'variant', link);

    expect(await (await replica(dragonfly)).get('image', 'variant')).toEqual(
      link
    );
  });

  it('keeps links when a new release starts', async () => {
    const dragonfly = new FakeDragonfly();
    await (await replica(dragonfly, 'release-1')).set('image', 'variant', link);

    expect(
      await (await replica(dragonfly, 'release-2')).get('image', 'variant')
    ).toEqual(link);
  });

  it('stores links under a key without release or namespace version', async () => {
    const dragonfly = new FakeDragonfly();

    await (await replica(dragonfly)).set('image', 'variant', link);

    expect(valueWrites(dragonfly)).toEqual([
      expect.stringMatching(/^val:media:links:[0-9a-f]{64}$/),
    ]);
  });

  it('keeps missing links on the replica that saw them', async () => {
    const dragonfly = new FakeDragonfly();
    const cache = await replica(dragonfly);

    await cache.set('image', 'variant', missing, MISSING_LINK_TTL);

    expect(await cache.get('image', 'variant')).toEqual(missing);
    expect(
      await (await replica(dragonfly)).get('image', 'variant')
    ).toBeUndefined();
    expect(valueWrites(dragonfly)).toEqual([]);
  });

  it('drops a missing link after four hours', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const cache = await replica(new FakeDragonfly());

    await cache.set('image', 'variant', missing, MISSING_LINK_TTL);
    vi.advanceTimersByTime(MISSING_LINK_TTL + 1);

    expect(await cache.get('image', 'variant')).toBeUndefined();
  });

  it('serves a link once the object it was missing for exists', async () => {
    const cache = await replica(new FakeDragonfly());

    await cache.set('image', 'variant', missing, MISSING_LINK_TTL);
    await cache.set('image', 'variant', link);

    expect(await cache.get('image', 'variant')).toEqual(link);
  });

  it('stores any link under a key of fixed length', async () => {
    const dragonfly = new FakeDragonfly();
    const cache = await replica(dragonfly);

    await cache.set('a', 'variant', link);
    await cache.set('b'.repeat(10_000), 'c'.repeat(10_000), link);

    const [short, long] = valueWrites(dragonfly);
    expect(short.length).toBeLessThan(200);
    expect(long).toHaveLength(short.length);
  });

  it('serves a link another replica replaced within 2 s', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const dragonfly = new FakeDragonfly();
    const first = await replica(dragonfly);
    const second = await replica(dragonfly);
    await first.set('image', 'variant', link);
    expect(await second.get('image', 'variant')).toEqual(link);

    await first.set('image', 'variant', { uri: 'images/2', exists: true });
    vi.advanceTimersByTime(2001);

    expect(await second.get('image', 'variant')).toEqual({
      uri: 'images/2',
      exists: true,
    });
  });

  it('shares a rejected variant between replicas', async () => {
    const dragonfly = new FakeDragonfly();

    await (
      await replica(dragonfly)
    ).reject('image', 'variant', 'Transformation exceeds pixel limit!');

    expect(await (await replica(dragonfly)).rejection('image', 'variant')).toBe(
      'Transformation exceeds pixel limit!'
    );
    expect(valueWrites(dragonfly)).toEqual([
      expect.stringMatching(
        /^val:release-1:media:rejected-variants:[0-9a-f]{64}$/
      ),
    ]);
  });

  it('checks a rejected variant again when a new release starts', async () => {
    const dragonfly = new FakeDragonfly();
    await (
      await replica(dragonfly, 'release-1')
    ).reject('image', 'variant', 'Transformation exceeds pixel limit!');

    expect(
      await (
        await replica(dragonfly, 'release-2')
      ).rejection('image', 'variant')
    ).toBeUndefined();
  });

  it('forgets a rejected variant after an hour', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const cache = await replica(new FakeDragonfly());

    await cache.reject(
      'image',
      'variant',
      'Transformation exceeds pixel limit!'
    );
    vi.advanceTimersByTime(REJECTED_VARIANT_TTL + 1);

    expect(await cache.rejection('image', 'variant')).toBeUndefined();
  });

  it('serves a link from the local copy while Dragonfly is down', async () => {
    const dragonfly = new FakeDragonfly();
    const cache = await replica(dragonfly);
    await cache.set('image', 'variant', link);

    dragonfly.down();

    expect(await cache.get('image', 'variant')).toEqual(link);
  });

  describe('forget', () => {
    it('stops serving the links of a deleted image on the replica that deleted it', async () => {
      const cache = await replica(new FakeDragonfly());
      await cache.set('image', 'small', link);
      await cache.set('image', 'large', link);

      await cache.forget('image');

      expect(await cache.get('image', 'small')).toBeUndefined();
      expect(await cache.get('image', 'large')).toBeUndefined();
    });

    it('stops serving them on every other replica within 2 s', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      const dragonfly = new FakeDragonfly();
      const deleting = await replica(dragonfly);
      const other = await replica(dragonfly);
      await deleting.set('image', 'small', link);
      expect(await other.get('image', 'small')).toEqual(link);

      await deleting.forget('image');
      vi.advanceTimersByTime(GENERATION_CHECK_MS + 1);

      expect(await other.get('image', 'small')).toBeUndefined();
    });

    it('forgets missing links and rejected variants of the image too', async () => {
      const cache = await replica(new FakeDragonfly());
      await cache.set('image', 'missing', missing, MISSING_LINK_TTL);
      await cache.reject(
        'image',
        'huge',
        'Transformation exceeds pixel limit!'
      );

      await cache.forget('image');

      expect(await cache.get('image', 'missing')).toBeUndefined();
      expect(await cache.rejection('image', 'huge')).toBeUndefined();
    });

    it('serves links stored after the delete', async () => {
      const dragonfly = new FakeDragonfly();
      const cache = await replica(dragonfly);
      await cache.set('image', 'small', link);
      await cache.forget('image');

      await cache.set('image', 'small', { uri: 'images/2', exists: true });

      expect(await (await replica(dragonfly)).get('image', 'small')).toEqual({
        uri: 'images/2',
        exists: true,
      });
    });

    it('leaves the links of other images alone', async () => {
      const cache = await replica(new FakeDragonfly());
      await cache.set('other', 'small', link);

      await cache.forget('image');

      expect(await cache.get('other', 'small')).toEqual(link);
    });

    it('keeps the deletion for as long as a link can live', async () => {
      const dragonfly = new FakeDragonfly();
      const cache = await replica(dragonfly);

      await cache.forget('image');

      const write = dragonfly.commands.find(
        ([command, key]) =>
          command === 'SET' && key.startsWith('val:media:generations:')
      );
      expect(write?.slice(3)).toEqual(['PX', String(LINK_TTL)]);
    });

    it('asks Dragonfly for the generation of an image at most once per 2 s', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      const dragonfly = new FakeDragonfly();
      const cache = await replica(dragonfly);
      const generationReads = () =>
        dragonfly.commands.filter(
          ([command, key]) =>
            command === 'GET' && key.startsWith('val:media:generations:')
        ).length;

      for (let i = 0; i < 5; i++) {
        await cache.get('image', `variant-${i}`);
      }
      expect(generationReads()).toBe(1);

      vi.advanceTimersByTime(GENERATION_CHECK_MS + 1);
      await cache.get('image', 'variant-0');

      expect(generationReads()).toBe(2);
    });

    it('writes nothing to Dragonfly for an image that was never deleted', async () => {
      const dragonfly = new FakeDragonfly();
      const cache = await replica(dragonfly);

      await cache.get('image', 'small');

      expect(
        dragonfly.commands.filter(
          ([command, key]) =>
            command === 'SET' && key.startsWith('val:media:generations:')
        )
      ).toEqual([]);
    });
  });
});
