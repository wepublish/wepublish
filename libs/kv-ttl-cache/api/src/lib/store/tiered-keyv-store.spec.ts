import { Logger } from '@nestjs/common';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { UNSHARED_FALLBACK_TTL_MS } from '../kv-cache-timings';
import { type CacheProfile } from './cache-profile';
import { createKvCodec } from './kv-codec';
import { LocalTier } from './local-tier';
import { MAX_SHARED_VALUE_CHARS, SharePolicy } from './share-policy';
import { TieredKeyv, TieredKeyvStore } from './tiered-keyv-store';

const SHARED: CacheProfile = {
  name: 'shared',
  shared: true,
  keyPrefix: '',
};
const LOCAL: CacheProfile = { name: 'local', shared: false };

const sent = (fake: FakeDragonfly, command: string) =>
  fake.commands.filter(([name]) => name === command);

const replica = (
  fake: FakeDragonfly,
  {
    profile = SHARED,
    releaseId = 'dev',
    local = new LocalTier(),
  }: { profile?: CacheProfile; releaseId?: string; local?: LocalTier } = {}
) => {
  const store = new TieredKeyvStore({
    local,
    connection: fake,
    codec: createKvCodec(),
    policy: new SharePolicy(),
    profile,
    releaseId,
  });

  return { store, keyv: new TieredKeyv(store) };
};

describe('TieredKeyvStore', () => {
  let fake: FakeDragonfly;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    fake = new FakeDragonfly();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('sharing', () => {
    it('lets another replica use a value without loading it again', async () => {
      const writer = replica(fake);
      const reader = replica(fake);

      await writer.keyv.set('a', { id: 'a' }, 60000);

      await expect(reader.keyv.get('a')).resolves.toEqual({ id: 'a' });
      expect(sent(fake, 'SET')).toHaveLength(1);
      expect(sent(fake, 'GET')).toHaveLength(1);
    });

    it('asks Dragonfly for a value at most every two seconds', async () => {
      const writer = replica(fake);
      const reader = replica(fake);

      await writer.keyv.set('a', { id: 'a' }, 60000);
      await reader.keyv.get('a');
      vi.advanceTimersByTime(1999);
      await reader.keyv.get('a');

      expect(sent(fake, 'GET')).toHaveLength(1);

      vi.advanceTimersByTime(1);
      await reader.keyv.get('a');

      expect(sent(fake, 'GET')).toHaveLength(2);
    });

    it('keeps its own copy of a value it wrote for at most two seconds', async () => {
      const writer = replica(fake);

      await writer.keyv.set('a', { id: 'a' }, 60000);
      vi.advanceTimersByTime(1999);
      await writer.keyv.get('a');

      expect(sent(fake, 'GET')).toHaveLength(0);

      vi.advanceTimersByTime(1);

      await expect(writer.keyv.get('a')).resolves.toEqual({ id: 'a' });
      expect(sent(fake, 'GET')).toHaveLength(1);
    });

    it('hands out a new copy on every read', async () => {
      const writer = replica(fake);
      const value = { expiresAt: new Date('2030-01-01T00:00:00.000Z') };

      await writer.keyv.set('a', value, 60000);
      const first = await writer.keyv.get<typeof value>('a');
      const second = await writer.keyv.get<typeof value>('a');

      expect(first?.expiresAt).toBeInstanceOf(Date);
      expect(first).toEqual(value);
      expect(first).not.toBe(second);
    });

    it('stores nothing without a ttl', async () => {
      const writer = replica(fake);

      await expect(writer.keyv.set('a', { id: 'a' })).resolves.toBe(false);
      await expect(writer.keyv.get('a')).resolves.toBeUndefined();
      expect(sent(fake, 'SET')).toHaveLength(0);
    });

    it.each([null, undefined])(
      'does not put %s results into Dragonfly',
      async value => {
        const writer = replica(fake);

        await writer.keyv.set('a', value, 60000);

        await expect(writer.keyv.get('a')).resolves.toBeUndefined();
        expect(sent(fake, 'SET')).toHaveLength(0);
      }
    );

    it('keeps a value with a secret field out of Dragonfly but still caches it for its full ttl', async () => {
      const writer = replica(fake);
      const reader = replica(fake);

      await writer.keyv.set('a', { apiKey: 'sk_live_1' }, 60000);
      vi.advanceTimersByTime(59999);

      await expect(writer.keyv.get('a')).resolves.toEqual({
        apiKey: 'sk_live_1',
      });
      await expect(reader.keyv.get('a')).resolves.toBeUndefined();
      expect(sent(fake, 'SET')).toHaveLength(0);
    });

    it('keeps values over 256 KB on the replica for their full ttl', async () => {
      const writer = replica(fake);
      const value = 'x'.repeat(MAX_SHARED_VALUE_CHARS);

      await writer.keyv.set('a', value, 60000);
      vi.advanceTimersByTime(59999);

      await expect(writer.keyv.get('a')).resolves.toBe(value);
      expect(sent(fake, 'SET')).toHaveLength(0);
    });

    it('names the namespace that holds a secret field, once per namespace and field', async () => {
      const writer = replica(fake);
      const error = vi.mocked(Logger.prototype.error);

      await writer.keyv.set('ns:settings:v1:a', { apiKey: 'a' }, 60000);
      await writer.keyv.set('ns:settings:v1:b', { apiKey: 'b' }, 60000);
      await writer.keyv.set(
        'ns:peering:remote-profiles:vk2~1:c',
        { apiKey: 'c' },
        60000
      );

      expect(error.mock.calls).toEqual([
        ['Not storing settings in Dragonfly, it contains the field apiKey'],
        [
          'Not storing peering:remote-profiles in Dragonfly, it contains the field apiKey',
        ],
      ]);
    });

    it('names the profile that holds a secret field when the key has no namespace', async () => {
      const writer = replica(fake, {
        profile: { ...SHARED, name: 'answers' },
      });

      await writer.keyv.set('a', { apiKey: 'a' }, 60000);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Not storing answers in Dragonfly, it contains the field apiKey'
      );
    });

    it('shares a value whose own serialization is exactly 256 KB', async () => {
      const writer = replica(fake);
      const value = 'x'.repeat(MAX_SHARED_VALUE_CHARS - 2);

      await writer.keyv.set('a', value, 60000);

      expect(sent(fake, 'SET')).toHaveLength(1);
    });

    it('keeps a value whose own serialization is just over 256 KB local', async () => {
      const writer = replica(fake);
      const value = 'x'.repeat(MAX_SHARED_VALUE_CHARS - 1);

      await writer.keyv.set('a', value, 60000);

      expect(sent(fake, 'SET')).toHaveLength(0);
    });

    it('says when a batch write stored nothing', async () => {
      const writer = replica(fake);

      await expect(
        writer.keyv.setMany([
          { key: 'a', value: { id: 'a' }, ttl: 60000 },
          { key: 'b', value: { views: BigInt(1) }, ttl: 60000 },
          { key: 'c', value: { id: 'c' } },
        ])
      ).resolves.toEqual([true, false, false]);
    });

    it('says it kept nothing for a value it cannot store', async () => {
      const writer = replica(fake);

      await expect(
        writer.keyv.set('a', { views: BigInt(1) }, 60000)
      ).resolves.toBe(false);
      await expect(writer.keyv.get('a')).resolves.toBeUndefined();
      expect(sent(fake, 'SET')).toHaveLength(0);
    });
  });

  describe('while Dragonfly is unavailable', () => {
    it('keeps a value that could not reach Dragonfly for at most 30 s', async () => {
      const writer = replica(fake);

      fake.down();
      await writer.keyv.set('a', { id: 'a' }, 600000);
      vi.advanceTimersByTime(UNSHARED_FALLBACK_TTL_MS - 1);

      await expect(writer.keyv.get('a')).resolves.toEqual({ id: 'a' });

      vi.advanceTimersByTime(1);

      await expect(writer.keyv.get('a')).resolves.toBeUndefined();
    });

    it('keeps a value Dragonfly refused for exactly 30 s', async () => {
      const writer = replica(fake);

      fake.rejectNext('SET');
      await writer.keyv.set('a', { id: 'a' }, 600000);
      vi.advanceTimersByTime(29999);

      await expect(writer.keyv.get('a')).resolves.toEqual({ id: 'a' });

      vi.advanceTimersByTime(1);

      await expect(writer.keyv.get('a')).resolves.toBeUndefined();
    });

    it('keeps the full ttl for values kept local on purpose, like oversized ones', async () => {
      const writer = replica(fake);
      const value = 'x'.repeat(MAX_SHARED_VALUE_CHARS + 1);

      fake.down();
      await writer.keyv.set('a', value, 600000);
      vi.advanceTimersByTime(599999);

      await expect(writer.keyv.get('a')).resolves.toBe(value);
    });

    it('keeps a value of a local profile for at most 30 s', async () => {
      const writer = replica(fake, { profile: LOCAL });

      fake.down();
      await writer.keyv.set('a', { id: 'a' }, 600000);
      vi.advanceTimersByTime(29999);

      await expect(writer.keyv.get('a')).resolves.toEqual({ id: 'a' });

      vi.advanceTimersByTime(1);

      await expect(writer.keyv.get('a')).resolves.toBeUndefined();
    });

    it('keeps a value of a local profile for its full ttl while Dragonfly is reachable', async () => {
      const writer = replica(fake, { profile: LOCAL });

      await writer.keyv.set('a', { id: 'a' }, 600000);
      vi.advanceTimersByTime(599999);

      await expect(writer.keyv.get('a')).resolves.toEqual({ id: 'a' });
      expect(fake.commands).toEqual([]);
    });

    it('answers a batch with misses', async () => {
      const reader = replica(fake);

      fake.down();

      await expect(reader.keyv.getMany(['a', 'b'])).resolves.toEqual([
        undefined,
        undefined,
      ]);
    });

    it('answers a batch with misses when the connection throws', async () => {
      const reader = replica(fake);

      vi.spyOn(fake, 'mget').mockRejectedValue(new Error('broken'));

      await expect(reader.keyv.getMany(['a', 'b'])).resolves.toEqual([
        undefined,
        undefined,
      ]);
    });
  });

  describe('profiles', () => {
    it('keeps its local copy of a shared value for as long as configured', async () => {
      const profile = { ...SHARED, name: 'links', localCopyMs: 10000 };
      const writer = replica(fake, { profile });
      const reader = replica(fake, { profile });

      await writer.keyv.set('a', { id: 'a' }, 60000);
      await reader.keyv.get('a');
      vi.advanceTimersByTime(9999);
      await reader.keyv.get('a');

      expect(sent(fake, 'GET')).toHaveLength(1);

      vi.advanceTimersByTime(1);
      await reader.keyv.get('a');

      expect(sent(fake, 'GET')).toHaveLength(2);
    });

    it('caps a local copy at the time the shared value has left', async () => {
      const profile = { ...SHARED, name: 'links', localCopyMs: 600000 };
      const writer = replica(fake, { profile });
      const reader = replica(fake, { profile });

      await writer.keyv.set('a', { id: 'a' }, 5000);
      vi.advanceTimersByTime(1000);

      await expect(reader.keyv.get('a')).resolves.toEqual({ id: 'a' });

      vi.advanceTimersByTime(3999);

      await expect(reader.keyv.get('a')).resolves.toEqual({ id: 'a' });
      expect(sent(fake, 'GET')).toHaveLength(1);

      vi.advanceTimersByTime(1);

      await expect(reader.keyv.get('a')).resolves.toBeUndefined();
      expect(sent(fake, 'GET')).toHaveLength(2);
    });

    it('keeps the values of a global profile across releases', async () => {
      const profile: CacheProfile = {
        name: 'links',
        shared: true,
        scope: 'global',
        keyPrefix: 'links:',
      };
      const writer = replica(fake, { profile, releaseId: 'r1' });
      const reader = replica(fake, { profile, releaseId: 'r2' });

      await writer.keyv.set('a', { id: 'a' }, 60000);

      await expect(reader.keyv.get('a')).resolves.toEqual({ id: 'a' });
      expect(sent(fake, 'SET')[0][1]).toBe('val:links:a');
    });

    it('scopes the values of a release profile to their release', async () => {
      const profile: CacheProfile = {
        name: 'answers',
        shared: true,
        keyPrefix: 'answers:',
      };
      const writer = replica(fake, { profile, releaseId: 'r1' });
      const reader = replica(fake, { profile, releaseId: 'r2' });

      await writer.keyv.set('a', { id: 'a' }, 60000);

      await expect(reader.keyv.get('a')).resolves.toBeUndefined();
      expect(sent(fake, 'SET')[0][1]).toBe('val:r1:answers:a');
      expect(sent(fake, 'GET')[0][1]).toBe('val:r2:answers:a');
    });

    it('keeps two profiles with the same key apart', async () => {
      const local = new LocalTier();
      const answers = replica(fake, {
        local,
        profile: { name: 'answers', shared: true, keyPrefix: 'answers:' },
      });
      const links = replica(fake, {
        local,
        profile: { name: 'links', shared: true, keyPrefix: 'links:' },
      });
      const otherAnswers = replica(fake, {
        profile: { name: 'answers', shared: true, keyPrefix: 'answers:' },
      });

      await answers.keyv.set('x', 'answer', 60000);
      await links.keyv.set('x', 'link', 60000);

      await expect(answers.keyv.get('x')).resolves.toBe('answer');
      await expect(links.keyv.get('x')).resolves.toBe('link');
      await expect(otherAnswers.keyv.get('x')).resolves.toBe('answer');
    });

    it('never asks Dragonfly for a local profile', async () => {
      const reader = replica(fake, { profile: LOCAL });

      await reader.keyv.get('a');
      await reader.keyv.getMany(['a', 'b']);
      await reader.keyv.delete('a');

      expect(fake.commands).toEqual([]);
    });
  });

  describe('reading', () => {
    it('counts a value it cannot parse as a miss and leaves it alone', async () => {
      const reader = replica(fake);

      await fake.set('val:dev:a', '{not json', { px: 60000 });
      fake.commands.length = 0;

      await expect(reader.keyv.get('a')).resolves.toBeUndefined();
      expect(sent(fake, 'DEL')).toHaveLength(0);
    });

    it('counts a value written in another format as a miss and keeps no copy', async () => {
      const reader = replica(fake);

      await fake.set('val:dev:a', JSON.stringify({ id: 'a' }), { px: 60000 });
      fake.commands.length = 0;

      await expect(reader.keyv.get('a')).resolves.toBeUndefined();
      await expect(reader.keyv.get('a')).resolves.toBeUndefined();
      expect(sent(fake, 'GET')).toHaveLength(2);
    });

    it('counts an expired value as a miss and does not delete it', async () => {
      const reader = replica(fake);

      await fake.set(
        'val:dev:a',
        JSON.stringify({ value: 1, expires: Date.now() - 1 }),
        { px: 60000 }
      );
      fake.commands.length = 0;

      await expect(reader.keyv.get('a')).resolves.toBeUndefined();
      await expect(reader.keyv.getMany(['a'])).resolves.toEqual([undefined]);
      expect(sent(fake, 'DEL')).toHaveLength(0);
    });

    it('reads the keys missing locally with one MGET and keeps local copies', async () => {
      const writer = replica(fake);
      const reader = replica(fake);

      await writer.keyv.set('a', { id: 'a' }, 60000);
      await writer.keyv.set('b', { id: 'b' }, 60000);
      await reader.keyv.get('a');
      fake.commands.length = 0;

      await expect(reader.keyv.getMany(['a', 'b', 'c'])).resolves.toEqual([
        { id: 'a' },
        { id: 'b' },
        undefined,
      ]);
      expect(fake.commands).toEqual([['MGET', 'val:dev:b', 'val:dev:c']]);

      await reader.keyv.getMany(['a', 'b']);

      expect(fake.commands).toHaveLength(1);
    });
  });

  describe('deleting', () => {
    it('deletes the local copy and the shared value', async () => {
      const writer = replica(fake);
      const reader = replica(fake);

      await writer.keyv.set('a', { id: 'a' }, 60000);
      await writer.keyv.delete('a');

      await expect(writer.keyv.get('a')).resolves.toBeUndefined();
      await expect(reader.keyv.get('a')).resolves.toBeUndefined();
      expect(sent(fake, 'DEL')).toEqual([['DEL', 'val:dev:a']]);
    });

    it('deletes a batch with one DEL', async () => {
      const writer = replica(fake);

      await writer.keyv.set('a', { id: 'a' }, 60000);
      await writer.keyv.set('b', { id: 'b' }, 60000);
      await writer.keyv.deleteMany(['a', 'b']);

      await expect(writer.keyv.getMany(['a', 'b'])).resolves.toEqual([
        undefined,
        undefined,
      ]);
      expect(sent(fake, 'DEL')).toEqual([['DEL', 'val:dev:a', 'val:dev:b']]);
    });

    it('cannot clear everything', async () => {
      const { store } = replica(fake);

      await expect(store.clear()).rejects.toThrow(
        'TieredKeyvStore cannot clear; reset the namespace version instead'
      );
    });
  });
});
