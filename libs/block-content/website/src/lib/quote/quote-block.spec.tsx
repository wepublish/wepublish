import { screen } from '@testing-library/react';
import {
  mockImage,
  mockQuoteBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { QuoteBlock } from './quote-block';

describe('QuoteBlock', () => {
  it('shows the quote and cites its author', () => {
    const { container } = renderWithProviders(
      <QuoteBlock
        {...mockQuoteBlock({
          quote: 'Journalism is a public good.',
          author: 'Jane Doe',
          image: null,
        })}
      />
    );

    expect(
      screen.getByText('Journalism is a public good.')
    ).toBeInTheDocument();
    expect(screen.getByText('Jane Doe').tagName).toBe('CITE');
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('leaves out the citation when there is no author', () => {
    const { container } = renderWithProviders(
      <QuoteBlock {...mockQuoteBlock({ author: null, image: null })} />
    );

    expect(container.querySelector('cite')).not.toBeInTheDocument();
  });

  it('shows the image of the quoted person', () => {
    renderWithProviders(
      <QuoteBlock
        {...mockQuoteBlock({
          image: mockImage({ description: 'Portrait of Jane Doe' }),
        })}
      />
    );

    expect(
      screen.getByRole('img', { name: 'Portrait of Jane Doe' })
    ).toBeInTheDocument();
  });
});
