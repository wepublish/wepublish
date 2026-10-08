import * as Sentry from '@sentry/nestjs';

export type CacheLookup<T> = {
  value: T;
  hit: boolean;
  keys?: number;
  misses?: number;
};

export const traceCacheGet = <T>(
  namespace: string,
  lookup: () => Promise<CacheLookup<T>>
): Promise<T> =>
  Sentry.startSpan(
    {
      name: namespace,
      op: 'cache.get',
      onlyIfParent: true,
      attributes: { 'cache.key': [namespace] },
    },
    async span => {
      const { value, hit, keys, misses } = await lookup();

      span.setAttribute('cache.hit', hit);

      if (keys !== undefined) {
        span.setAttribute('cache.keys', keys);
      }

      if (misses !== undefined) {
        span.setAttribute('cache.misses', misses);
      }

      return value;
    }
  );
