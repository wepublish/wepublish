import { Logger } from '@nestjs/common';

const CLOCK_DRIFT_MS = 2000;

const logger = new Logger('PublicationTimers');

export class PublicationTimers {
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  schedule(publications: Date[], run: () => Promise<void>) {
    for (const publication of publications) {
      const at = publication.getTime();

      if (this.timers.has(at)) {
        continue;
      }

      const timer = setTimeout(
        () => {
          this.timers.delete(at);
          run().catch(error =>
            logger.error(
              `Could not clear caches for a scheduled publication: ${
                error instanceof Error ? error.message : String(error)
              }`
            )
          );
        },
        Math.max(0, at - Date.now()) + CLOCK_DRIFT_MS
      );
      timer.unref?.();
      this.timers.set(at, timer);
    }
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers.clear();
  }
}
