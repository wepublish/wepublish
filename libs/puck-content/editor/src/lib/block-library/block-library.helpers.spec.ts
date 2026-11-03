import { BlockCategory } from './block-library.catalog';
import {
  catalogFromComponents,
  filterCatalog,
  puckCategories,
} from './block-library.helpers';

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

const components = {
  TeaserDate: { category: 'teaser', group: 'teaserParts', order: 2 },
  YouTube: { category: 'media', order: 2 },
  Title: { category: 'text', order: 1 },
  Teaser: { category: 'teaser', order: 1 },
  Legacy: {},
  Image: { category: 'media', order: 1 },
  TeaserTitle: { category: 'teaser', group: 'teaserParts', order: 1 },
  RichText: { category: 'text', order: 2 },
} as const;

describe('catalogFromComponents', () => {
  it('sorts the blocks into the catalog categories by their order', () => {
    expect(catalogFromComponents(components)).toEqual([
      { id: 'text', blocks: ['Title', 'RichText'] },
      { id: 'media', blocks: ['Image', 'YouTube'] },
      {
        id: 'teaser',
        blocks: ['Teaser'],
        group: { id: 'teaserParts', blocks: ['TeaserTitle', 'TeaserDate'] },
      },
      { id: 'other', blocks: ['Legacy'] },
    ]);
  });

  it('leaves out hidden blocks', () => {
    expect(
      catalogFromComponents({
        Image: components.Image,
        SavedBlocks: { hidden: true },
      })
    ).toEqual([{ id: 'media', blocks: ['Image'] }]);
  });

  it('leaves out categories without blocks', () => {
    expect(catalogFromComponents({ Image: components.Image })).toEqual([
      { id: 'media', blocks: ['Image'] },
    ]);
  });
});

describe('puckCategories', () => {
  it('turns the components into Puck categories including the group blocks', () => {
    expect(puckCategories(components)).toEqual({
      text: { components: ['Title', 'RichText'] },
      media: { components: ['Image', 'YouTube'] },
      teaser: { components: ['Teaser', 'TeaserTitle', 'TeaserDate'] },
      other: { visible: false },
    });
  });
});
