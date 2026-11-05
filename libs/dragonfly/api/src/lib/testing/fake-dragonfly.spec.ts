import { FakeDragonfly } from './fake-dragonfly';

describe('FakeDragonfly', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is shared like Dragonfly and keeps what every replica writes', async () => {
    const fake = new FakeDragonfly();

    await fake.set('nsv:settings', 'v1', { nx: true });

    expect(fake.shared).toBe(true);
    await expect(fake.get('nsv:settings')).resolves.toEqual({
      ok: true,
      value: 'v1',
    });
    await expect(fake.set('nsv:settings', 'v2', { nx: true })).resolves.toEqual(
      { ok: true, value: false }
    );
  });

  it('records every command it was sent, keys without prefix', async () => {
    const fake = new FakeDragonfly();

    await fake.set('lock:job', 'token', { px: 60_000, nx: true });
    await fake.get('lock:job');
    await fake.mget(['a', 'b']);
    await fake.incr('count:x');
    await fake.pexpire('count:x', 1000);
    await fake.del(['a', 'b']);
    await fake.probe('health', '1', 60_000);

    expect(fake.commands).toEqual([
      ['SET', 'lock:job', 'token', 'NX', 'PX', '60000'],
      ['GET', 'lock:job'],
      ['MGET', 'a', 'b'],
      ['INCR', 'count:x'],
      ['PEXPIRE', 'count:x', '1000'],
      ['DEL', 'a', 'b'],
      ['SET', 'health', '1', 'PX', '60000'],
    ]);
  });

  it('answers nothing while down, and remembers since when', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-02T10:00:00.000Z'));
    const fake = new FakeDragonfly();
    await fake.set('key', 'a');

    fake.down();
    vi.setSystemTime(new Date('2026-10-02T10:00:05.000Z'));

    expect(fake.isAvailable()).toBe(false);
    expect(fake.outageSince()).toBe(
      new Date('2026-10-02T10:00:00.000Z').getTime()
    );
    await expect(fake.get('key')).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    });
    await expect(fake.probe('health', '1', 60_000)).resolves.toBe(false);
    expect(fake.commands).toEqual([['SET', 'key', 'a']]);
  });

  it('answers again once up, and forgets the outage with its first answer', async () => {
    const fake = new FakeDragonfly();
    await fake.set('key', 'a');
    fake.down();

    fake.up();

    expect(fake.isAvailable()).toBe(true);
    expect(fake.outageSince()).toBeDefined();
    await expect(fake.get('key')).resolves.toEqual({ ok: true, value: 'a' });
    expect(fake.outageSince()).toBeUndefined();
  });

  it('refuses the next command of a kind without applying it', async () => {
    const fake = new FakeDragonfly();

    fake.rejectNext('SET');

    await expect(fake.get('key')).resolves.toEqual({ ok: true, value: null });
    await expect(fake.set('key', 'a')).resolves.toEqual({
      ok: false,
      reason: 'rejected',
    });
    await expect(fake.get('key')).resolves.toEqual({ ok: true, value: null });
    await expect(fake.set('key', 'b')).resolves.toEqual({
      ok: true,
      value: true,
    });
    expect(fake.isAvailable()).toBe(true);
  });

  it('answers late while stalled', async () => {
    vi.useFakeTimers();
    const fake = new FakeDragonfly();
    await fake.set('key', 'a');
    fake.stall(1500);
    let answered = false;

    const reply = fake.get('key').then(result => {
      answered = true;

      return result;
    });
    await vi.advanceTimersByTimeAsync(1499);
    expect(answered).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    await expect(reply).resolves.toEqual({ ok: true, value: 'a' });

    fake.stall(0);
    await expect(fake.get('key')).resolves.toEqual({ ok: true, value: 'a' });
  });
});
