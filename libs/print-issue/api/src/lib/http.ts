export type Source = 'wepublish' | 'bexio';

/** An upstream api did not answer as expected; status null = no answer at all. */
export class UpstreamError extends Error {
  constructor(
    public source: Source,
    public status: number | null,
    message: string
  ) {
    super(message);
  }
}

export const isRetryable = (error: unknown): boolean => {
  if (error instanceof UpstreamError) {
    return error.status === null || error.status === 429 || error.status >= 500;
  }

  // fetch reports network failures as TypeError, deadlines as AbortError
  return (
    error instanceof TypeError ||
    (error instanceof DOMException &&
      (error.name === 'AbortError' || error.name === 'TimeoutError'))
  );
};

type RetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  shouldRetry?: (error: unknown) => boolean;
};

const wait = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

/** Runs `fn` up to `attempts` times with doubling pauses (same policy as the importer's bexio client). */
export async function retry<T>(
  fn: () => Promise<T>,
  {
    attempts = 3,
    baseDelayMs = 200,
    sleep = wait,
    shouldRetry = isRetryable,
  }: RetryOptions = {}
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= attempts || !shouldRetry(error)) {
        throw error;
      }

      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
}

export const DEFAULT_TIMEOUT_MS = 20_000;

/** fetch with a deadline; no answer at all (timeout, network) becomes an UpstreamError with status null */
export const fetchUpstream = (
  source: Source,
  fetchFn: typeof fetch,
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> =>
  fetchFn(url, { ...init, signal: AbortSignal.timeout(timeoutMs) }).catch(
    (error: unknown) => {
      throw new UpstreamError(
        source,
        null,
        error instanceof Error ?
          `${error.name}: ${error.message}`
        : String(error)
      );
    }
  );
