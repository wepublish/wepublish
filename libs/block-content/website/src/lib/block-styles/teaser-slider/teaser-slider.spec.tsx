import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockEventTeaser,
  mockPageTeaser,
  mockTeaserGridBlock,
  mockTeaserListBlock,
  mockTeaserSlotsBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { t } from 'i18next';
import { BlockRenderer } from '../../blocks';

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
  mockArticleTeaser({ title: 'Article' }),
  mockPageTeaser({ title: 'Page' }),
  mockEventTeaser({ title: 'Event' }),
];

describe('Slider block style for teasers', () => {
  it('renders a slide per teaser of a teaser grid', () => {
    renderBlock(mockTeaserGridBlock({ blockStyle: 'Slider', teasers }));

    expect(headingTexts()).toEqual(['Article', 'Page', 'Event']);
  });

  it('renders a slide per teaser of a teaser list, below its title', () => {
    renderBlock(
      mockTeaserListBlock({
        blockStyle: 'Slider',
        title: 'Foobar Title',
        teasers,
      })
    );

    expect(headingTexts()).toEqual([
      'Foobar Title',
      'Article',
      'Page',
      'Event',
    ]);
  });

  it('renders a slide per teaser of teaser slots', () => {
    renderBlock(
      mockTeaserSlotsBlock({ blockStyle: 'Slider', title: null, teasers })
    );

    expect(headingTexts()).toEqual(['Article', 'Page', 'Event']);
  });

  it('offers a navigation button per slide', async () => {
    renderBlock(mockTeaserGridBlock({ blockStyle: 'Slider', teasers }));

    for (const index of [1, 2, 3]) {
      expect(
        await screen.findByRole('button', {
          name: t('slider.slide', { index }),
        })
      ).toBeInTheDocument();
    }

    expect(
      screen.queryByRole('button', { name: t('slider.slide', { index: 4 }) })
    ).not.toBeInTheDocument();
  });

  it('skips teasers whose content no longer exists', () => {
    renderBlock(
      mockTeaserGridBlock({
        blockStyle: 'Slider',
        teasers: [
          mockArticleTeaser({ title: 'Article' }),
          mockArticleTeaser({ title: 'Deleted', article: null }),
          null,
        ],
      })
    );

    expect(headingTexts()).toEqual(['Article']);
  });

  it('renders nothing when no teaser has content', () => {
    const { container } = renderBlock(
      mockTeaserListBlock({
        blockStyle: 'Slider',
        title: 'Foobar Title',
        teasers: [mockArticleTeaser({ article: null })],
      })
    );

    expect(container).toBeEmptyDOMElement();
  });
});
