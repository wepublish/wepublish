import { LruMap } from './kv-ttl-cache-lru-map';

describe('LruMap', () => {
  it('drops the least recently used entry once the limit is reached', () => {
    const map = new LruMap<string, number>(2);

    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);

    expect([...map.keys()]).toEqual(['b', 'c']);
  });

  it('counts reading an entry as using it', () => {
    const map = new LruMap<string, number>(2);

    map.set('a', 1);
    map.set('b', 2);
    map.get('a');
    map.set('c', 3);

    expect([...map.keys()]).toEqual(['a', 'c']);
  });

  it('does not grow when an existing entry is overwritten', () => {
    const map = new LruMap<string, number>(2);

    map.set('a', 1);
    map.set('b', 2);
    map.set('a', 3);

    expect(map.size).toBe(2);
    expect(map.get('a')).toBe(3);
    expect(map.get('b')).toBe(2);
  });
});
