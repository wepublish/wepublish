import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockFlexAlignment,
  mockFlexTeaser,
  mockTeaserGridFlexBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { TeaserGridFlexBlock } from './teaser-grid-flex-block';

const flexTeaser = (title: string, x: number, y: number) =>
  mockFlexTeaser({
    alignment: mockFlexAlignment({ x, y, w: 4, h: 2 }),
    teaser: mockArticleTeaser({ title }),
  });

describe('TeaserGridFlexBlock', () => {
  it('renders the teasers row by row, left to right', () => {
    renderWithProviders(
      <TeaserGridFlexBlock
        {...mockTeaserGridFlexBlock({
          flexTeasers: [
            flexTeaser('Bottom right', 8, 2),
            flexTeaser('Top right', 8, 0),
            flexTeaser('Bottom left', 0, 2),
            flexTeaser('Top left', 0, 0),
          ],
        })}
      />
    );

    expect(
      screen
        .getAllByRole('heading', { level: 1 })
        .map(heading => heading.textContent)
    ).toEqual(['Top left', 'Top right', 'Bottom left', 'Bottom right']);
  });

  it('skips flex teasers without content', () => {
    renderWithProviders(
      <TeaserGridFlexBlock
        {...mockTeaserGridFlexBlock({
          flexTeasers: [
            flexTeaser('Visible', 0, 0),
            mockFlexTeaser({ teaser: null }),
            mockFlexTeaser({
              teaser: mockArticleTeaser({ title: 'Deleted', article: null }),
            }),
          ],
        })}
      />
    );

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Visible' })
    ).toBeInTheDocument();
  });
});
