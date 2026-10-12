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

  describe('with a size limit', () => {
    it('drops the least recently used entries once the size limit is reached', () => {
      const map = new LruMap<string, string>(100, 10);

      map.set('a', '1234');
      map.set('b', '1234');
      map.set('c', '1234');

      expect([...map.keys()]).toEqual(['b', 'c']);
      expect(map.bytes).toBe(10);
    });

    it('counts the new size when an entry is overwritten', () => {
      const map = new LruMap<string, string>(100, 10);

      map.set('a', '1234');
      map.set('a', '12');

      expect(map.bytes).toBe(3);
    });

    it('does not keep an entry larger than the size limit', () => {
      const map = new LruMap<string, string>(100, 10);

      map.set('a', '1234');
      map.set('b', '1234567890');

      expect([...map.keys()]).toEqual(['a']);
      expect(map.bytes).toBe(5);
    });

    it('frees the size of deleted entries', () => {
      const map = new LruMap<string, string>(100, 10);

      map.set('a', '1234');
      map.delete('a');
      map.set('b', '123456789');

      expect([...map.keys()]).toEqual(['b']);
      expect(map.bytes).toBe(10);
    });
  });
});
