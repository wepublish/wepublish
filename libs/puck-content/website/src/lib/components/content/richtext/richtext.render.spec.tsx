import { screen } from '@testing-library/react';
import {
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { createElement } from 'react';

import { emptyPuckBlockData } from '../../../blocks/block.types';
import { RichTextRender } from './richtext.render';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const renderRichText = () =>
  renderWithProviders(
    createElement(RichTextRender, {
      id: 'RichText-1',
      props: { richText: mockRichTextParagraph('The council met on Monday.') },
      data: emptyPuckBlockData,
      slots: {},
      className: 'styled-block',
    })
  );

describe('RichTextRender', () => {
  it('shows the stored rich text', () => {
    renderRichText();

    expect(screen.getByText('The council met on Monday.')).toBeInTheDocument();
  });

  it('puts the class name on its single root element', () => {
    const { container } = renderRichText();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass('styled-block');
  });
});
