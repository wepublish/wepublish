import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Pings an HTTP endpoint using the global fetch.
 *
 * Terminus' own HttpHealthIndicator resolves its optional peer at runtime with
 * `import.meta.resolve('@nestjs/axios')` + `await import(...)`, and aborted the
 * API on boot with 'The "@nestjs/axios" package is missing' when it ran as a
 * pkg binary; this needs no optional peer at all.
 */
@Injectable()
export class HttpPingHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService
  ) {}

  public pingCheck<Key extends string>(
    key: Key,
    url: string | undefined,
    { timeout = DEFAULT_TIMEOUT_MS }: { timeout?: number } = {}
  ): PromiseLike<HealthIndicatorResult<Key>> {
    return this.healthIndicatorService
      .check(key)
      .attempt(async ({ signal }) => {
        if (!url) {
          throw new Error(`No url configured for the "${key}" health check`);
        }

        const response = await fetch(url, { method: 'GET', signal });

        if (!response.ok) {
          throw new Error(
            `${url} answered with status ${response.status.toString()}`
          );
        }

        return { statusCode: response.status };
      })
      .withTimeout(timeout);
  }
}
