import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

export const REPLICAS_CAUGHT_UP_MS = 3000;

const logger = new Logger('KvCache');

@Injectable()
export class CatchUpScheduler implements OnModuleDestroy {
  private timers = new Set<ReturnType<typeof setTimeout>>();

  after(ms: number, task: () => Promise<unknown>): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      Promise.resolve()
        .then(task)
        .catch(error =>
          logger.error(`A catch-up task failed: ${String(error)}`)
        );
    }, ms);

    timer.unref?.();
    this.timers.add(timer);
  }

  onModuleDestroy() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}
