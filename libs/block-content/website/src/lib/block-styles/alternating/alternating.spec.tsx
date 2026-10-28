import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockBreakBlock,
  mockPageTeaser,
  mockTeaserGridBlock,
  mockTeaserListBlock,
  mockTeaserSlotsBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { BlockRenderer } from '../../blocks';
import {
  isAlternatingTeaserGridBlockStyle,
  isAlternatingTeaserListBlockStyle,
  isAlternatingTeaserSlotsBlockStyle,
} from './is-alternating';

const renderBlock = (block: FullBlockFragment) =>
  renderWithProviders(
    <BlockRenderer
      block={block}
      index={0}
      count={1}
      type="Page"
    />
  );

const headingTexts = () =>
  screen
    .getAllByRole('heading', { level: 1 })
    .map(heading => heading.textContent);

const teasers = [
  mockArticleTeaser({ title: 'First' }),
  mockPageTeaser({ title: 'Second', preTitle: null }),
  mockArticleTeaser({ title: 'Third' }),
];

describe('Alternating block style', () => {
  it('renders every teaser of a teaser grid', () => {
    renderBlock(
      mockTeaserGridBlock({ blockStyle: 'Alternating', numColumns: 3, teasers })
    );

    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(headingTexts()).toEqual(['First', 'Second', 'Third']);
  });

  it('renders the title and every teaser of a teaser list', () => {
    renderBlock(
      mockTeaserListBlock({
        blockStyle: 'Alternating',
        title: 'Foobar Title',
        teasers,
      })
    );

    expect(headingTexts()).toEqual([
      'Foobar Title',
      'First',
      'Second',
      'Third',
    ]);
  });

  it('renders the title and the filled teasers of teaser slots', () => {
    renderBlock(
      mockTeaserSlotsBlock({
        blockStyle: 'Alternating',
        title: 'Featured Stories',
        teasers: [...teasers, null],
      })
    );

    expect(headingTexts()).toEqual([
      'Featured Stories',
      'First',
      'Second',
      'Third',
    ]);
  });
});

describe('alternating block style predicates', () => {
  it('match teaser blocks of their own type with the Alternating style', () => {
    expect(
      isAlternatingTeaserGridBlockStyle(
        mockTeaserGridBlock({ blockStyle: 'Alternating' })
      )
    ).toBe(true);
    expect(
      isAlternatingTeaserListBlockStyle(
        mockTeaserListBlock({ blockStyle: 'Alternating' })
      )
    ).toBe(true);
    expect(
      isAlternatingTeaserSlotsBlockStyle(
        mockTeaserSlotsBlock({ blockStyle: 'Alternating' })
      )
    ).toBe(true);
  });

  it('reject other block styles and other block types', () => {
    expect(
      isAlternatingTeaserGridBlockStyle(
        mockTeaserGridBlock({ blockStyle: 'Slider' })
      )
    ).toBe(false);
    expect(
      isAlternatingTeaserListBlockStyle(
        mockTeaserGridBlock({ blockStyle: 'Alternating' })
      )
    ).toBe(false);
    expect(
      isAlternatingTeaserSlotsBlockStyle(
        mockBreakBlock({ blockStyle: 'Alternating' })
      )
    ).toBe(false);
  });
});
