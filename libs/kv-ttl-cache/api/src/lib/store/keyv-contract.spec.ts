import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { Keyv } from 'keyv';
import { createKvCodec } from './kv-codec';
import { LocalTier } from './local-tier';
import { SharePolicy } from './share-policy';
import { TieredKeyv, TieredKeyvStore } from './tiered-keyv-store';

const createStore = (fake: FakeDragonfly) =>
  new TieredKeyvStore({
    local: new LocalTier(),
    connection: fake,
    codec: createKvCodec(),
    policy: new SharePolicy(),
    profile: { name: 'shared', shared: true, keyPrefix: '' },
    releaseId: 'dev',
  });

describe('TieredKeyvStore under Keyv', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('can be handed to a plain Keyv', () => {
    const store = createStore(new FakeDragonfly());

    expect(() => new Keyv({ store })).not.toThrow();
  });

  it('receives the value as an object under the key it was given', async () => {
    const store = createStore(new FakeDragonfly());
    const set = vi.spyOn(store, 'set');
    const keyv = new TieredKeyv(store);

    await keyv.set('ns:a:v1:x', { id: 'x' }, 1000);

    expect(set).toHaveBeenCalledWith(
      'ns:a:v1:x',
      { value: { id: 'x' }, expires: expect.any(Number) },
      1000
    );
  });

  it('answers a batch while Dragonfly is down', async () => {
    const fake = new FakeDragonfly();
    const keyv = new TieredKeyv(createStore(fake));

    fake.down();

    await expect(keyv.getMany(['a', 'b'])).resolves.toEqual([
      undefined,
      undefined,
    ]);
  });

  it('never makes Keyv delete a value it considers expired', async () => {
    vi.useFakeTimers();
    const fake = new FakeDragonfly();
    const keyv = new TieredKeyv(createStore(fake));

    await keyv.set('a', { id: 'a' }, 1000);
    await fake.set(
      'val:dev:b',
      JSON.stringify({ value: 1, expires: Date.now() - 1 }),
      { px: 60000 }
    );
    vi.advanceTimersByTime(1001);

    await expect(keyv.get('a')).resolves.toBeUndefined();
    await expect(keyv.get('b')).resolves.toBeUndefined();
    await expect(keyv.getMany(['a', 'b'])).resolves.toEqual([
      undefined,
      undefined,
    ]);
    expect(fake.commands.filter(([command]) => command === 'DEL')).toEqual([]);
  });

  it('refuses to clear through Keyv, and keeps the values', async () => {
    const fake = new FakeDragonfly();
    const store = createStore(fake);
    const keyv = new TieredKeyv(store);

    await keyv.set('a', { id: 'a' }, 60000);

    await expect(store.clear()).rejects.toThrow('cannot clear');
    await expect(keyv.clear()).rejects.toThrow('cannot clear');

    await expect(keyv.get('a')).resolves.toEqual({ id: 'a' });
  });
});
