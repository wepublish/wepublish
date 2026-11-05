import { Injectable } from '@nestjs/common';
import { DragonflyConnection } from './dragonfly-connection';

export type CountResult =
  | { status: 'counted'; count: number }
  | { status: 'not-configured' | 'unavailable' };

@Injectable()
export class DistributedCounters {
  constructor(private readonly connection: DragonflyConnection) {}

  async increment(name: string, windowMs: number): Promise<CountResult> {
    if (!this.connection.shared) {
      return { status: 'not-configured' };
    }

    const key = `count:${name}`;
    const created = await this.connection.set(key, '0', {
      px: windowMs,
      nx: true,
    });

    if (!created.ok) {
      return { status: 'unavailable' };
    }

    const count = await this.connection.incr(key);

    if (!count.ok) {
      return { status: 'unavailable' };
    }

    const renewed = await this.connection.pexpire(key, windowMs);

    return renewed.ok === false && renewed.reason === 'unavailable' ?
        { status: 'unavailable' }
      : { status: 'counted', count: count.value };
  }

  async forget(name: string): Promise<void> {
    if (this.connection.shared) {
      await this.connection.del([`count:${name}`]);
    }
  }
}
