import { LocalTier } from './local-tier';

describe('LocalTier', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps a text until its ttl is over', () => {
    vi.useFakeTimers();
    const local = new LocalTier();

    local.set('shared:a', '{"value":1}', 1000);
    vi.advanceTimersByTime(999);

    expect(local.get('shared:a')).toBe('{"value":1}');

    vi.advanceTimersByTime(1);

    expect(local.get('shared:a')).toBeUndefined();
  });

  it('forgets a deleted text', () => {
    const local = new LocalTier();

    local.set('shared:a', 'x', 1000);
    local.delete('shared:a');

    expect(local.get('shared:a')).toBeUndefined();
  });

  it('keeps nothing for a ttl that is already over', () => {
    const local = new LocalTier();

    local.set('shared:a', 'x', 1000);
    local.set('shared:a', 'y', 0);

    expect(local.get('shared:a')).toBeUndefined();
  });

  it('keeps at most 50 000 entries by default', () => {
    const local = new LocalTier();

    for (let index = 0; index <= 50000; index++) {
      local.set(`shared:${index}`, 'x', 60000);
    }

    expect(local.get('shared:0')).toBeUndefined();
    expect(local.get('shared:50000')).toBe('x');
  });

  it('counts the key and the text against its character budget', () => {
    const local = new LocalTier(100, 20);

    local.set('a:1', '1234567', 60000);
    local.set('a:2', '1234567', 60000);
    local.set('a:3', '1234567', 60000);

    expect(local.get('a:1')).toBeUndefined();
    expect(local.get('a:2')).toBe('1234567');
    expect(local.get('a:3')).toBe('1234567');
  });

  it('refuses a second profile with the same name', () => {
    const local = new LocalTier();

    local.register({ name: 'media:links', shared: false });

    expect(() =>
      local.register({ name: 'media:links', shared: false })
    ).toThrow('media:links');
  });

  it('refuses two shared profiles that would write the same Dragonfly keys', () => {
    const local = new LocalTier();

    local.register({ name: 'links', shared: true, keyPrefix: 'links:' });

    expect(() =>
      local.register({ name: 'other', shared: true, keyPrefix: 'links:' })
    ).toThrow('links:');
  });

  it('allows the same key prefix in different scopes', () => {
    const local = new LocalTier();

    local.register({ name: 'links', shared: true, keyPrefix: 'links:' });

    expect(() =>
      local.register({
        name: 'global-links',
        shared: true,
        scope: 'global',
        keyPrefix: 'links:',
      })
    ).not.toThrow();
  });
});
