import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Pings an HTTP endpoint using the global fetch.
 *
 * Terminus' own HttpHealthIndicator cannot be used here: it asserts its
 * optional peer with `import.meta.resolve('@nestjs/axios')` and loads it with
 * `await import(...)`, neither of which a @yao-pkg/pkg snapshot can resolve, so
 * the API aborted on boot with 'The "@nestjs/axios" package is missing' even
 * though the package was installed and used elsewhere.
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
