import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockEventTeaser,
  mockPageTeaser,
  mockTeaserListBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { TeaserListBlock } from './teaser-list-block';

describe('TeaserListBlock', () => {
  it('renders every teaser in order', () => {
    renderWithProviders(
      <TeaserListBlock
        {...mockTeaserListBlock({
          teasers: [
            mockArticleTeaser({ title: 'Article' }),
            mockPageTeaser({ title: 'Page' }),
            mockEventTeaser({ title: 'Event' }),
          ],
        })}
      />
    );

    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(
      screen
        .getAllByRole('heading', { level: 1 })
        .map(heading => heading.textContent)
    ).toEqual(['Article', 'Page', 'Event']);
  });

  it('shows the block title above the teasers', () => {
    renderWithProviders(
      <TeaserListBlock {...mockTeaserListBlock({ title: 'Foobar Title' })} />
    );

    expect(screen.getAllByRole('heading', { level: 1 })[0]).toHaveTextContent(
      'Foobar Title'
    );
  });

  it('shows no block title when there is none', () => {
    renderWithProviders(
      <TeaserListBlock
        {...mockTeaserListBlock({
          title: null,
          teasers: [mockArticleTeaser({ title: 'Article' })],
        })}
      />
    );

    expect(
      screen
        .getAllByRole('heading', { level: 1 })
        .map(heading => heading.textContent)
    ).toEqual(['Article']);
  });
});
