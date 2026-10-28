import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockCustomTeaser,
  mockEventTeaser,
  mockPageTeaser,
  mockTeaserSlotsBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { TeaserSlotsBlock } from './teaser-slots-block';

const headingTexts = () =>
  screen
    .getAllByRole('heading', { level: 1 })
    .map(heading => heading.textContent);

describe('TeaserSlotsBlock', () => {
  it('renders teasers of every type in order', () => {
    renderWithProviders(
      <TeaserSlotsBlock
        {...mockTeaserSlotsBlock({
          title: null,
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
    expect(headingTexts()).toEqual(['Article', 'Page', 'Event', 'Custom']);
  });

  it('shows the block title before the teasers', () => {
    renderWithProviders(
      <TeaserSlotsBlock
        {...mockTeaserSlotsBlock({
          title: 'Featured Stories',
          teasers: [mockArticleTeaser({ title: 'Article' })],
        })}
      />
    );

    expect(headingTexts()).toEqual(['Featured Stories', 'Article']);
  });

  it('skips empty slots and teasers whose content no longer exists', () => {
    renderWithProviders(
      <TeaserSlotsBlock
        {...mockTeaserSlotsBlock({
          title: null,
          teasers: [
            null,
            mockArticleTeaser({ title: 'Deleted', article: null }),
            mockArticleTeaser({ title: 'Article' }),
          ],
        })}
      />
    );

    expect(headingTexts()).toEqual(['Article']);
  });
});
