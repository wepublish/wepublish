import {
  DistributedCounters,
  type DragonflyConnection,
  MemoryDragonflyConnection,
} from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { FailureCounter } from './failure-counter';

const WINDOW_MS = 60_000;

describe('FailureCounter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const replica = (dragonfly: DragonflyConnection = new FakeDragonfly()) =>
    new FailureCounter(new DistributedCounters(dragonfly));

  it('counts failures per name', async () => {
    const counter = replica();

    await counter.record('a', WINDOW_MS);
    await counter.record('a', WINDOW_MS);
    await counter.record('b', WINDOW_MS);

    expect(counter.count('a')).toBe(2);
    expect(counter.count('b')).toBe(1);
    expect(counter.count('c')).toBe(0);
  });

  it('forgets a name', async () => {
    const counter = replica();

    await counter.record('a', WINDOW_MS);
    await counter.forget('a');

    expect(counter.count('a')).toBe(0);
    await expect(counter.record('a', WINDOW_MS)).resolves.toBe(1);
  });

  it('starts over once the window has passed', async () => {
    vi.useFakeTimers();
    const counter = replica(new MemoryDragonflyConnection());

    await counter.record('a', WINDOW_MS);
    vi.advanceTimersByTime(WINDOW_MS + 1);

    expect(counter.count('a')).toBe(0);
    await expect(counter.record('a', WINDOW_MS)).resolves.toBe(1);
  });

  it('adds up the failures of every replica', async () => {
    const dragonfly = new FakeDragonfly();
    const a = replica(dragonfly);
    const b = replica(dragonfly);

    await a.record('a', WINDOW_MS);
    await a.record('a', WINDOW_MS);
    await a.record('a', WINDOW_MS);

    await expect(b.record('a', WINDOW_MS)).resolves.toBe(4);
    expect(b.count('a')).toBe(4);
  });

  it('forgets a name on every replica', async () => {
    const dragonfly = new FakeDragonfly();
    const a = replica(dragonfly);
    const b = replica(dragonfly);

    await a.record('a', WINDOW_MS);
    await a.record('a', WINDOW_MS);
    await b.forget('a');

    await expect(b.record('a', WINDOW_MS)).resolves.toBe(1);
  });

  it('keeps counting on this replica without Dragonfly', async () => {
    const counter = replica(new MemoryDragonflyConnection());

    await counter.record('a', WINDOW_MS);

    await expect(counter.record('a', WINDOW_MS)).resolves.toBe(2);
  });

  it('keeps counting on this replica while Dragonfly is down', async () => {
    const dragonfly = new FakeDragonfly();
    const counter = replica(dragonfly);
    dragonfly.down();

    await counter.record('a', WINDOW_MS);

    await expect(counter.record('a', WINDOW_MS)).resolves.toBe(2);
  });
});
