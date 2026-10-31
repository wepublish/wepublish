import { screen } from '@testing-library/react';
import {
  mockImage,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { createElement } from 'react';

import { emptyPuckBlockData, PuckBlockData } from '../../blocks/block.types';
import { BreakRender } from './break.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const campaign = mockImage({ description: 'Campaign poster' });

const renderBreak = (
  data: PuckBlockData = emptyPuckBlockData,
  extra: Partial<Parameters<typeof BreakRender>[0]> = {}
) =>
  renderWithProviders(
    createElement(BreakRender, {
      id: 'Break-1',
      props: {
        text: 'Support independent journalism',
        richText: mockRichTextParagraph('Every contribution counts.'),
        hideButton: false,
        linkText: 'Become a member',
        linkURL: '/membership',
        linkTarget: '_self',
      },
      data,
      slots: {},
      className: 'styled-block',
      ...extra,
    })
  );

describe('BreakRender', () => {
  it('shows the headline, the text and the button from the stored props', () => {
    renderBreak();

    expect(
      screen.getByText('Support independent journalism')
    ).toBeInTheDocument();
    expect(screen.getByText('Every contribution counts.')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Become a member' })
    ).toHaveAttribute('href', '/membership');
  });

  it('shows the first image the datasource yields', () => {
    renderBreak({ ...emptyPuckBlockData, images: [campaign] });

    expect(
      screen.getByRole('img', { name: 'Campaign poster' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Support independent journalism')).toHaveLength(
      1
    );
  });

  it('shows no image until the datasource yields one', () => {
    renderBreak();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('puts the class name on its single root element', () => {
    const { container } = renderBreak();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass('styled-block');
  });

  it('hands the button to the ref the editor passes', () => {
    const button = vi.fn();

    renderBreak(emptyPuckBlockData, { refs: { button } });

    expect(button).toHaveBeenCalledWith(
      screen.getByRole('link', { name: 'Become a member' })
    );
  });
});
