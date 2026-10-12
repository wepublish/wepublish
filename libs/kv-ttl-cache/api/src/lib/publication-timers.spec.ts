import { PublicationTimers } from './publication-timers';

describe('PublicationTimers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs shortly after the publication time, once the database agrees it is published', async () => {
    const timers = new PublicationTimers();
    const run = vi.fn().mockResolvedValue(undefined);

    timers.schedule([new Date('2026-10-01T10:00:30.000Z')], run);

    await vi.advanceTimersByTimeAsync(31_999);
    expect(run).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('schedules each publication time once', async () => {
    const timers = new PublicationTimers();
    const run = vi.fn().mockResolvedValue(undefined);
    const at = new Date('2026-10-01T10:00:30.000Z');

    timers.schedule([at, at], run);
    timers.schedule([at], run);
    await vi.advanceTimersByTimeAsync(60_000);

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('can schedule the same time again after it ran', async () => {
    const timers = new PublicationTimers();
    const run = vi.fn().mockResolvedValue(undefined);
    const at = new Date('2026-10-01T10:00:30.000Z');

    timers.schedule([at], run);
    await vi.advanceTimersByTimeAsync(60_000);
    vi.setSystemTime(new Date('2026-10-01T10:00:00.000Z'));
    timers.schedule([at], run);
    await vi.advanceTimersByTimeAsync(60_000);

    expect(run).toHaveBeenCalledTimes(2);
  });

  it('stops every pending timer', async () => {
    const timers = new PublicationTimers();
    const run = vi.fn().mockResolvedValue(undefined);

    timers.schedule([new Date('2026-10-01T10:00:30.000Z')], run);
    timers.clear();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(run).not.toHaveBeenCalled();
  });

  it('keeps going when a run fails', async () => {
    const timers = new PublicationTimers();
    const run = vi.fn().mockRejectedValue(new Error('Dragonfly down'));

    timers.schedule([new Date('2026-10-01T10:00:30.000Z')], run);

    await expect(vi.advanceTimersByTimeAsync(60_000)).resolves.not.toThrow();
  });
});
