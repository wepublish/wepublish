import type Bexio from 'bexio';

/**
 * A bexio call gets this long. The library sends through axios's global
 * instance without a timeout, so a call bexio never answers would hang the
 * nightly run, which renews one subscription after the other, forever.
 * Generous on purpose: issuing an invoice or rendering its pdf takes a while.
 */
export const BEXIO_REQUEST_TIMEOUT_MS = 60_000;

export class BexioTimeoutError extends Error {
  constructor(method: string, path: string, timeoutMs: number) {
    super(`bexio did not answer ${method} ${path} within ${timeoutMs} ms`);
    this.name = 'BexioTimeoutError';
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
 * there, which beats a run that never ends.
 */
export function withRequestTimeout(
  bexio: Bexio,
  timeoutMs = BEXIO_REQUEST_TIMEOUT_MS
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
    };
  }

  return bexio;
}
