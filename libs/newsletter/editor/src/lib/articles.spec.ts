import type { ArticleChoice } from './articles';
import {
  leadExcerpt,
  searchArticles,
  sortNewestFirst,
  tagOptions,
} from './articles';

const article = (overrides: Partial<ArticleChoice>): ArticleChoice => ({
  id: 'x',
  title: 'Title',
  lead: null,
  url: 'https://site/a',
  preTitle: null,
  imageUrl: null,
  publishedAt: '2026-01-01T00:00:00.000Z',
  tags: [],
  ...overrides,
});

describe('articles', () => {
  const list = [
    article({ id: 'a', title: 'Solarstrom boomt', tags: ['solar', 'markt'] }),
    article({
      id: 'b',
      title: 'Windpark eröffnet',
      lead: 'Im Jura',
      tags: ['wind'],
    }),
    article({
      id: 'c',
      title: 'Alpine PV',
      preTitle: 'Solar',
      tags: ['solar'],
      publishedAt: '2026-02-01T00:00:00.000Z',
    }),
  ];

  it('searches title, kicker and lead, optionally within a tag', () => {
    expect(searchArticles(list, 'jura').map(a => a.id)).toEqual(['b']);
    expect(searchArticles(list, 'solar').map(a => a.id)).toEqual(['a', 'c']);
    expect(searchArticles(list, '', 'solar').map(a => a.id)).toEqual([
      'a',
      'c',
    ]);
    expect(searchArticles(list, 'alpine', 'wind')).toEqual([]);
  });

  it('offers tags commonest first with counts', () => {
    expect(tagOptions(list, 'All')).toEqual([
      { label: 'All', value: '' },
      { label: 'solar (2)', value: 'solar' },
      { label: 'markt (1)', value: 'markt' },
      { label: 'wind (1)', value: 'wind' },
    ]);
  });

  it('sorts newest first', () => {
    expect(sortNewestFirst(list).map(a => a.id)).toEqual(['c', 'a', 'b']);
  });

  it('cuts the lead on a word boundary', () => {
    expect(leadExcerpt('one two three four', 10)).toBe('one two …');
    expect(leadExcerpt(null)).toBe('—');
  });
});
