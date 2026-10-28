import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockCustomTeaser,
  mockEventTeaser,
  mockPageTeaser,
  mockTeaserGridBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  alignmentForTeaserBlock,
  isFilledTeaser,
  TeaserGridBlock,
} from './teaser-grid-block';

const teaserTitles = () =>
  screen
    .getAllByRole('heading', { level: 1 })
    .map(heading => heading.textContent);

describe('TeaserGridBlock', () => {
  it('renders every teaser in order', () => {
    renderWithProviders(
      <TeaserGridBlock
        {...mockTeaserGridBlock({
          teasers: [
            mockArticleTeaser({ title: 'Article' }),
            mockPageTeaser({ title: 'Page' }),
            mockEventTeaser({ title: 'Event' }),
            mockCustomTeaser({ title: 'Custom' }),
          ],
        })}
      />
    );

    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(teaserTitles()).toEqual(['Article', 'Page', 'Event', 'Custom']);
  });

  it('skips teasers whose content no longer exists', () => {
    renderWithProviders(
      <TeaserGridBlock
        {...mockTeaserGridBlock({
          teasers: [
            mockArticleTeaser({ title: 'Article' }),
            mockArticleTeaser({ title: 'Deleted article', article: null }),
            mockPageTeaser({ title: 'Deleted page', page: null }),
            mockEventTeaser({ title: 'Deleted event', event: null }),
            null,
          ],
        })}
      />
    );

    expect(teaserTitles()).toEqual(['Article']);
  });

  it('renders no teasers when the block has none', () => {
    renderWithProviders(
      <TeaserGridBlock {...mockTeaserGridBlock({ teasers: [] })} />
    );

    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});

describe('alignmentForTeaserBlock', () => {
  it('places teasers left to right, row by row, across the 12 column grid', () => {
    expect(
      [0, 1, 2, 3].map(index => alignmentForTeaserBlock(index, 3))
    ).toEqual([
      { __typename: 'FlexAlignment', i: '0', h: 1, w: 4, x: 0, y: 0 },
      { __typename: 'FlexAlignment', i: '1', h: 1, w: 4, x: 4, y: 0 },
      { __typename: 'FlexAlignment', i: '2', h: 1, w: 4, x: 8, y: 0 },
      { __typename: 'FlexAlignment', i: '3', h: 1, w: 4, x: 0, y: 1 },
    ]);
  });

  it('gives a single column teaser the full width', () => {
    expect(alignmentForTeaserBlock(2, 1)).toMatchObject({ w: 12, x: 0, y: 2 });
  });
});

describe('isFilledTeaser', () => {
  it('accepts custom teasers and teasers whose content exists', () => {
    expect(isFilledTeaser(mockArticleTeaser())).toBe(true);
    expect(isFilledTeaser(mockPageTeaser())).toBe(true);
    expect(isFilledTeaser(mockEventTeaser())).toBe(true);
    expect(isFilledTeaser(mockCustomTeaser())).toBe(true);
  });

  it('rejects empty slots and teasers whose content is gone', () => {
    expect(isFilledTeaser(null)).toBe(false);
    expect(isFilledTeaser(undefined)).toBe(false);
    expect(isFilledTeaser(mockArticleTeaser({ article: null }))).toBe(false);
    expect(isFilledTeaser(mockPageTeaser({ page: null }))).toBe(false);
    expect(isFilledTeaser(mockEventTeaser({ event: null }))).toBe(false);
  });
});
