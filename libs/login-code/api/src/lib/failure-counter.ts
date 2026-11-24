import { DistributedCounters } from '@wepublish/dragonfly/api';

type LocalCount = { count: number; expiresAt: number };

/**
 * Failed attempts per name within a window. This replica's own count always
 * applies, so the limit holds without Dragonfly; with Dragonfly every failure
 * also learns the total of all replicas. A replica only learns that total when
 * it records a failure itself, so across n replicas a limit can be exceeded by
 * at most n - 1 attempts.
 */
export class FailureCounter {
  private local = new Map<string, LocalCount>();

  constructor(private counters: DistributedCounters) {}

  count(name: string): number {
    const known = this.local.get(name);

    if (!known || known.expiresAt <= Date.now()) {
      return 0;
    }

    return known.count;
  }

  async record(name: string, windowMs: number): Promise<number> {
    const expiresAt = Date.now() + windowMs;
    const localCount = this.count(name) + 1;
    const shared = await this.counters.increment(name, windowMs);
    const count =
      shared.status === 'counted' ?
        Math.max(localCount, shared.count)
      : localCount;

    this.local.set(name, { count, expiresAt });

    return count;
  }

  async forget(name: string): Promise<void> {
    this.local.delete(name);
    await this.counters.forget(name);
  }
}
