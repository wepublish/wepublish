import { Logger } from '@nestjs/common';
import { CatchUpScheduler, REPLICAS_CAUGHT_UP_MS } from './catch-up-scheduler';

describe('CatchUpScheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('waits three seconds for the other replicas to catch up', () => {
    expect(REPLICAS_CAUGHT_UP_MS).toBe(3000);
  });

  it('runs a task once after the given time', async () => {
    vi.useFakeTimers();
    const scheduler = new CatchUpScheduler();
    const task = vi.fn().mockResolvedValue(undefined);

    scheduler.after(3000, task);
    await vi.advanceTimersByTimeAsync(2999);

    expect(task).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await vi.advanceTimersByTimeAsync(60_000);

    expect(task).toHaveBeenCalledTimes(1);
  });

  it('never keeps the process alive for a task', () => {
    const timeouts = vi.spyOn(globalThis, 'setTimeout');
    const scheduler = new CatchUpScheduler();

    scheduler.after(60_000, vi.fn().mockResolvedValue(undefined));
    const timer = timeouts.mock.results[0].value as NodeJS.Timeout;

    expect(timer.hasRef()).toBe(false);
    scheduler.onModuleDestroy();
  });

  it('drops every task that has not run yet when the module is destroyed', async () => {
    vi.useFakeTimers();
    const scheduler = new CatchUpScheduler();
    const first = vi.fn().mockResolvedValue(undefined);
    const second = vi.fn().mockResolvedValue(undefined);

    scheduler.after(3000, first);
    scheduler.after(6000, second);
    scheduler.onModuleDestroy();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('logs a task that fails instead of leaving the rejection unhandled', async () => {
    vi.useFakeTimers();
    const logged = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const scheduler = new CatchUpScheduler();

    scheduler.after(3000, () => Promise.reject(new Error('Dragonfly is gone')));
    scheduler.after(3000, () => {
      throw new Error('thrown at once');
    });
    await vi.advanceTimersByTimeAsync(3000);

    expect(logged).toHaveBeenCalledTimes(2);
    expect(String(logged.mock.calls[0][0])).toContain('Dragonfly is gone');
    expect(String(logged.mock.calls[1][0])).toContain('thrown at once');
  });
});
