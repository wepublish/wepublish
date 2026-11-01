import { BlockCategory } from './block-library.catalog';
import { filterCatalog, puckCategories } from './block-library.helpers';

const catalog: BlockCategory[] = [
  { id: 'text', blocks: ['Title', 'RichText'] },
  { id: 'media', blocks: ['Image', 'YouTube'] },
  {
    id: 'teaser',
    blocks: ['Teaser'],
    group: { id: 'teaserParts', blocks: ['TeaserTitle', 'TeaserDate'] },
  },
];

const labels: Record<string, string> = {
  text: 'Text',
  media: 'Media',
  teaser: 'Teasers',
  teaserParts: 'Inside a teaser',
  Title: 'Heading',
  RichText: 'Text',
  Image: 'Image',
  YouTube: 'YouTube',
  Teaser: 'Teaser',
  TeaserTitle: 'Teaser title',
  TeaserDate: 'Teaser date',
};

const label = (key: string) => labels[key] ?? key;

describe('filterCatalog', () => {
  it('keeps everything without a query', () => {
    expect(filterCatalog(catalog, '  ', label)).toEqual(catalog);
  });

  it('matches the readable name regardless of case', () => {
    expect(filterCatalog(catalog, 'HEAD', label)).toEqual([
      { id: 'text', blocks: ['Title'] },
    ]);
  });

  it('matches the component key as well', () => {
    expect(filterCatalog(catalog, 'richtext', label)).toEqual([
      { id: 'text', blocks: ['RichText'] },
    ]);
  });

  it('ignores accents in the query and the names', () => {
    expect(
      filterCatalog(catalog, 'medi', key =>
        key === 'media' ? 'Médias' : label(key)
      )
    ).toEqual([{ id: 'media', blocks: ['Image', 'YouTube'] }]);
  });

  it('keeps a whole category when its name matches', () => {
    expect(filterCatalog(catalog, 'media', label)).toEqual([
      { id: 'media', blocks: ['Image', 'YouTube'] },
    ]);
  });

  it('keeps matching group blocks inside their group', () => {
    expect(filterCatalog(catalog, 'date', label)).toEqual([
      {
        id: 'teaser',
        blocks: [],
        group: { id: 'teaserParts', blocks: ['TeaserDate'] },
      },
    ]);
  });

  it('returns nothing when no block matches', () => {
    expect(filterCatalog(catalog, 'zzz', label)).toEqual([]);
  });
});

describe('puckCategories', () => {
  it('turns the catalog into Puck categories including the group blocks', () => {
    expect(puckCategories(catalog)).toEqual({
      text: { components: ['Title', 'RichText'] },
      media: { components: ['Image', 'YouTube'] },
      teaser: { components: ['Teaser', 'TeaserTitle', 'TeaserDate'] },
      other: { visible: false },
    });
  });
});
