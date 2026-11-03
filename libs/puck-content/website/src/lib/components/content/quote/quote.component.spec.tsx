import { screen } from '@testing-library/react';
import { mockImage, renderWithProviders } from '@wepublish/mocks/website';
import { createElement } from 'react';

import { emptyPuckBlockData, PuckBlockData } from '../../../blocks/block.types';
import { QuoteRender } from './quote.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const portrait = mockImage({ description: 'Portrait of the author' });

const renderQuote = (data: PuckBlockData = emptyPuckBlockData) =>
  renderWithProviders(
    createElement(QuoteRender, {
      id: 'Quote-1',
      props: { quote: 'Veni, vidi, vici', author: 'Julius Caesar' },
      data,
      slots: {},
      className: 'styled-block',
    })
  );

describe('QuoteRender', () => {
  it('shows the quote and its author from the stored props', () => {
    renderQuote();

    expect(screen.getByText('Veni, vidi, vici')).toBeInTheDocument();
    expect(screen.getByText('Julius Caesar')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the first image the datasource yields', () => {
    renderQuote({ ...emptyPuckBlockData, images: [portrait] });

    expect(
      screen.getByRole('img', { name: 'Portrait of the author' })
    ).toBeInTheDocument();
  });

  it('puts the class name on its single root element', () => {
    const { container } = renderQuote();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass('styled-block');
  });
});
