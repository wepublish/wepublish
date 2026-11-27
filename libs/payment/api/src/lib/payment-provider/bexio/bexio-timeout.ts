import type Bexio from 'bexio';

/**
 * A bexio call gets this long. The library sends through axios's global
 * instance without a timeout, so a call bexio never answers would hang the
 * nightly run, which renews one subscription after the other, forever.
 * Generous on purpose: issuing an invoice or rendering its pdf takes a while.
 */
export const BEXIO_REQUEST_TIMEOUT_MS = 60_000;

/**
 * After a call bexio did not answer, every call fails at once for this long
 * rather than each waiting out its own timeout: with bexio down, the nightly
 * run would otherwise wait a minute for every subscription it invoices.
 */
export const BEXIO_PAUSE_MS = 5 * 60_000;

export class BexioTimeoutError extends Error {
  constructor(method: string, path: string, timeoutMs: number) {
    super(`bexio did not answer ${method} ${path} within ${timeoutMs} ms`);
    this.name = 'BexioTimeoutError';
  }
}

export class BexioUnavailableError extends Error {
  constructor(method: string, path: string, until: Date) {
    super(
      `bexio did not answer a call a moment ago, ${method} ${path} is not tried until ${until.toISOString()}`
    );
    this.name = 'BexioUnavailableError';
  }
}

/** Ours, or node-fetch giving up on a request whose `signal` timed out. */
const isTimeout = (error: unknown) =>
  error instanceof BexioTimeoutError ||
  ['AbortError', 'TimeoutError'].includes((error as Error | null)?.name ?? '');

/**
 * Pauses all calls to one bexio account for {@link BEXIO_PAUSE_MS} once one
 * of them timed out. Kept by the payment provider, so it spans every gateway
 * and every step of the run; a refusal is an answer and pauses nothing.
 */
export class BexioBreaker {
  private pausedUntil = 0;

  constructor(
    private readonly pauseMs = BEXIO_PAUSE_MS,
    private readonly now: () => number = Date.now
  ) {}

  async call<T>(
    method: string,
    path: string,
    request: () => Promise<T>
  ): Promise<T> {
    if (this.now() < this.pausedUntil) {
      throw new BexioUnavailableError(method, path, new Date(this.pausedUntil));
    }

    try {
      return await request();
    } catch (error) {
      if (isTimeout(error)) {
        this.pausedUntil = this.now() + this.pauseMs;
      }

      throw error;
    }
  }
}

type Request = (
  method: string,
  path: string,
  ...rest: unknown[]
) => Promise<unknown>;

/**
 * Gives every call of `bexio`'s resources (contacts, invoices, …) up after
 * `timeoutMs`; all of them go through the resource's `request`. The request
 * itself is not aborted, the caller just stops waiting for it: a timed-out
 * call that bexio did carry out shows up as an extra contact or invoice
 * there, which beats a run that never ends. A timeout pauses `breaker`.
 */
export function withRequestTimeout(
  bexio: Bexio,
  timeoutMs = BEXIO_REQUEST_TIMEOUT_MS,
  breaker = new BexioBreaker()
): Bexio {
  for (const resource of Object.values(bexio) as unknown[]) {
    const target = resource as { request?: Request } | null;
    const request = target?.request;

    if (typeof request !== 'function') {
      continue;
    }

    target!.request = function requestWithTimeout(
      this: unknown,
      method: string,
      path: string,
      ...rest: unknown[]
    ) {
      return breaker.call(method, path, () => {
        let timer: NodeJS.Timeout | undefined;

        return Promise.race([
          request.call(this, method, path, ...rest),
          new Promise<never>((_, reject) => {
            timer = setTimeout(
              () => reject(new BexioTimeoutError(method, path, timeoutMs)),
              timeoutMs
            );
          }),
        ]).finally(() => clearTimeout(timer));
      });
    };
  }

  return bexio;
}
