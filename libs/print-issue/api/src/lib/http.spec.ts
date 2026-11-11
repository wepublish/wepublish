import { fetchUpstream, isRetryable, retry, UpstreamError } from './http';

describe('retry', () => {
  const noSleep = () => Promise.resolve();

  it('tries again on a retryable failure and returns the later success', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new UpstreamError('bexio', 503, 'busy'))
      .mockRejectedValueOnce(new UpstreamError('bexio', 429, 'slow down'))
      .mockResolvedValue('ok');

    await expect(retry(fn, { attempts: 3, sleep: noSleep })).resolves.toBe(
      'ok'
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('gives up after the last attempt with the last error', async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(new UpstreamError('wepublish', 500, 'down'));

    await expect(retry(fn, { attempts: 3, sleep: noSleep })).rejects.toThrow(
      'down'
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry what is not retryable', async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(new UpstreamError('wepublish', 401, 'nope'));

    await expect(retry(fn, { attempts: 3, sleep: noSleep })).rejects.toThrow(
      'nope'
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('waits longer each time', async () => {
    const sleep = vi.fn(async (_ms: number) => undefined);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new UpstreamError('bexio', 500, 'a'))
      .mockRejectedValueOnce(new UpstreamError('bexio', 500, 'b'))
      .mockResolvedValue('ok');

    await retry(fn, { attempts: 3, baseDelayMs: 100, sleep });

    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([100, 200]);
  });
});

describe('isRetryable', () => {
  it('retries rate limits, server errors, unknown status and network failures', () => {
    expect(isRetryable(new UpstreamError('bexio', 429, ''))).toBe(true);
    expect(isRetryable(new UpstreamError('bexio', 503, ''))).toBe(true);
    expect(isRetryable(new UpstreamError('bexio', null, 'timeout'))).toBe(true);
    expect(isRetryable(new TypeError('fetch failed'))).toBe(true);
  });

  it('does not retry client errors or application errors', () => {
    expect(isRetryable(new UpstreamError('bexio', 404, ''))).toBe(false);
    expect(isRetryable(new Error('unauthorized'))).toBe(false);
    expect(isRetryable(new Error('bug'))).toBe(false);
  });
});

describe('fetchUpstream', () => {
  it('turns a fetch that never answers into a retryable upstream error', async () => {
    const fetchFn = () =>
      Promise.reject(
        new DOMException(
          'The operation was aborted due to timeout',
          'TimeoutError'
        )
      );
    const error = await fetchUpstream(
      'wepublish',
      fetchFn as typeof fetch,
      'https://x'
    ).catch(e => e);

    expect(error).toBeInstanceOf(UpstreamError);
    expect(error).toMatchObject({ source: 'wepublish', status: null });
    expect(error.message).toBe(
      'TimeoutError: The operation was aborted due to timeout'
    );
    expect(isRetryable(error)).toBe(true);
  });
});
