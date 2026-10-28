import { MemoryDragonflyConnection } from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { OutagePeriod } from './outage-period';

const START = new Date('2026-10-02T10:00:00.000Z').getTime();

describe('OutagePeriod', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds nothing while Dragonfly answers', () => {
    expect(new OutagePeriod(new FakeDragonfly()).suffix()).toBe('');
  });

  it('adds nothing without Dragonfly', () => {
    expect(new OutagePeriod(new MemoryDragonflyConnection()).suffix()).toBe('');
  });

  it('adds nothing in the first 30 s of an outage', () => {
    const dragonfly = new FakeDragonfly();
    const outage = new OutagePeriod(dragonfly);

    dragonfly.down();
    vi.setSystemTime(START + 29_999);

    expect(outage.suffix()).toBe('');
  });

  it('moves on every 30 s of an outage, so values cached before it stop being used within a minute', () => {
    const dragonfly = new FakeDragonfly();
    const outage = new OutagePeriod(dragonfly);

    dragonfly.down();
    vi.setSystemTime(START + 30_000);
    expect(outage.suffix()).toBe('~1');

    vi.setSystemTime(START + 65_000);
    expect(outage.suffix()).toBe('~2');
  });

  it('adds nothing again once Dragonfly answers after an outage', async () => {
    const dragonfly = new FakeDragonfly();
    const outage = new OutagePeriod(dragonfly);

    dragonfly.down();
    vi.setSystemTime(START + 65_000);
    dragonfly.up();
    await dragonfly.get('nsv:auth:sessions');

    expect(outage.suffix()).toBe('');
  });
});
