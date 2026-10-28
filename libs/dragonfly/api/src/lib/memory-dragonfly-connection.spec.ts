import { MemoryDragonflyConnection } from './memory-dragonfly-connection';

describe('MemoryDragonflyConnection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is never shared and never down', () => {
    const connection = new MemoryDragonflyConnection();

    expect(connection.shared).toBe(false);
    expect(connection.isAvailable()).toBe(true);
    expect(connection.outageSince()).toBeUndefined();
  });

  it('only sets a key that is not there yet', async () => {
    const connection = new MemoryDragonflyConnection();

    await expect(connection.set('key', 'first', { nx: true })).resolves.toEqual(
      { ok: true, value: true }
    );
    await expect(
      connection.set('key', 'second', { nx: true })
    ).resolves.toEqual({ ok: true, value: false });
    await expect(connection.get('key')).resolves.toEqual({
      ok: true,
      value: 'first',
    });
  });

  it('forgets a key after its time to live', async () => {
    const connection = new MemoryDragonflyConnection();

    await connection.set('lock', '1', { px: 1000, nx: true });
    vi.advanceTimersByTime(1001);

    await expect(connection.get('lock')).resolves.toEqual({
      ok: true,
      value: null,
    });
    await expect(
      connection.set('lock', '1', { px: 1000, nx: true })
    ).resolves.toEqual({ ok: true, value: true });
  });

  it('overwrites and deletes keys', async () => {
    const connection = new MemoryDragonflyConnection();

    await connection.set('key', 'a');
    await connection.set('key', 'b');
    await expect(connection.mget(['key', 'other'])).resolves.toEqual({
      ok: true,
      value: ['b', null],
    });

    await expect(connection.del(['key', 'other'])).resolves.toEqual({
      ok: true,
      value: 1,
    });
    await expect(connection.get('key')).resolves.toEqual({
      ok: true,
      value: null,
    });
  });

  it('keeps a key that is still there for longer, but brings none back', async () => {
    const connection = new MemoryDragonflyConnection();
    await connection.set('lock', '1', { px: 1000, nx: true });

    vi.advanceTimersByTime(900);
    await expect(connection.pexpire('lock', 1000)).resolves.toEqual({
      ok: true,
      value: true,
    });
    await expect(connection.pexpire('gone', 1000)).resolves.toEqual({
      ok: true,
      value: false,
    });
    vi.advanceTimersByTime(900);

    await expect(connection.get('lock')).resolves.toEqual({
      ok: true,
      value: '1',
    });
    await expect(connection.get('gone')).resolves.toEqual({
      ok: true,
      value: null,
    });
  });

  it('counts up from nothing and keeps the expiry of the counter', async () => {
    const connection = new MemoryDragonflyConnection();

    await connection.set('count:x', '0', { px: 1000, nx: true });
    await expect(connection.incr('count:x')).resolves.toEqual({
      ok: true,
      value: 1,
    });
    await expect(connection.incr('count:y')).resolves.toEqual({
      ok: true,
      value: 1,
    });
    vi.advanceTimersByTime(1001);

    await expect(connection.get('count:x')).resolves.toEqual({
      ok: true,
      value: null,
    });
    await expect(connection.get('count:y')).resolves.toEqual({
      ok: true,
      value: '1',
    });
  });

  it('refuses to count a value that is no number', async () => {
    const connection = new MemoryDragonflyConnection();
    await connection.set('count:x', 'abc');

    await expect(connection.incr('count:x')).resolves.toEqual({
      ok: false,
      reason: 'rejected',
    });
  });

  it('answers the health probe', async () => {
    await expect(
      new MemoryDragonflyConnection().probe('health', '1', 60_000)
    ).resolves.toBe(true);
  });

  it('forgets everything once closed', async () => {
    const connection = new MemoryDragonflyConnection();
    await connection.set('key', 'a');

    await connection.close();

    await expect(connection.get('key')).resolves.toEqual({
      ok: true,
      value: null,
    });
  });
});
