import { createBoundedCache } from './bounded-cache';

describe('createBoundedCache', () => {
  it('builds a value once and returns it for the same key', () => {
    const cache = createBoundedCache<string, object>(2);
    const build = vi.fn(() => ({}));

    const first = cache.get('a', build);

    expect(cache.get('a', build)).toBe(first);
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('drops the least recently used key beyond its limit', () => {
    const cache = createBoundedCache<string, string>(2);

    cache.get('a', () => 'a');
    cache.get('b', () => 'b');
    cache.get('a', () => 'a again');
    cache.get('c', () => 'c');

    expect(cache.get('a', () => 'rebuilt')).toBe('a');
    expect(cache.get('b', () => 'rebuilt')).toBe('rebuilt');
  });

  it('peeks at a value without building or keeping one', () => {
    const cache = createBoundedCache<string, string>(1);

    expect(cache.peek('a')).toBeUndefined();

    cache.get('a', () => 'a');

    expect(cache.peek('a')).toBe('a');

    cache.get('b', () => 'b');

    expect(cache.peek('a')).toBeUndefined();
  });
});
