import {
  articleChunk,
  cacheControlFor,
  periodOf,
  periodRange,
  parseChunk,
} from './partition';

describe('periodOf', () => {
  const now = new Date('2026-10-08T12:00:00Z');

  it('groups past years by year', () => {
    expect(periodOf(new Date('2025-12-31T23:00:00Z'), now)).toEqual({
      year: 2025,
    });
  });

  it('groups the current year by month', () => {
    expect(periodOf(new Date('2026-02-03T10:00:00Z'), now)).toEqual({
      year: 2026,
      month: 2,
    });
  });
});

describe('periodRange', () => {
  it('spans a month in UTC, end exclusive', () => {
    expect(periodRange({ year: 2025, month: 12 })).toEqual({
      from: new Date('2025-12-01T00:00:00.000Z'),
      to: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('spans a year in UTC, end exclusive', () => {
    expect(periodRange({ year: 1929 })).toEqual({
      from: new Date('1929-01-01T00:00:00.000Z'),
      to: new Date('1930-01-01T00:00:00.000Z'),
    });
  });
});

describe('articleChunk / parseChunk', () => {
  it('round-trips a month chunk name', () => {
    expect(articleChunk({ year: 2026, month: 3 })).toBe('articles-2026-03');
    expect(parseChunk('articles-2026-03')).toEqual({
      type: 'articles',
      year: 2026,
      month: 3,
    });
  });

  it('round-trips a year chunk name', () => {
    expect(articleChunk({ year: 1929 })).toBe('articles-1929');
    expect(parseChunk('articles-1929')).toEqual({
      type: 'articles',
      year: 1929,
    });
  });

  it('parses the fixed chunks', () => {
    expect(parseChunk('news')).toEqual({ type: 'news' });
    expect(parseChunk('pages')).toEqual({ type: 'pages' });
  });

  it.each([
    'articles-2026-13',
    'articles-2026-00',
    'articles-26-03',
    'articles-2026-3',
    'articles-2026-03.xml',
    'articles-',
    'Pages',
    '',
    undefined,
  ])('rejects %s', name => {
    expect(parseChunk(name)).toBeNull();
  });
});

describe('cacheControlFor', () => {
  const now = new Date('2026-02-03T10:00:00Z');

  it('caches past months and years for long', () => {
    for (const chunk of [
      { type: 'articles', year: 2026, month: 1 },
      { type: 'articles', year: 2025 },
    ] as const) {
      expect(cacheControlFor(chunk, now)).toContain('s-maxage=86400');
    }
  });

  it('caches the current month, news, pages and the index briefly', () => {
    for (const chunk of [
      { type: 'articles', year: 2026, month: 2 },
      { type: 'articles', year: 2026 },
      { type: 'news' },
      { type: 'pages' },
      { type: 'index' },
    ] as const) {
      expect(cacheControlFor(chunk, now)).toContain('s-maxage=600');
    }
  });

  it('lets the CDN serve a stale copy when generating fails', () => {
    expect(cacheControlFor({ type: 'index' }, now)).toContain('stale-if-error');
  });
});
