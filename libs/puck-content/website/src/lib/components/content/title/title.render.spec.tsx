import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { createElement } from 'react';

import { emptyPuckBlockData } from '../../../blocks/block.types';
import { TitleRender } from './title.render';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const renderTitle = () =>
  renderWithProviders(
    createElement(TitleRender, {
      id: 'Title-1',
      props: {
        title: 'Election night',
        preTitle: 'Live',
        lead: 'All results as they come in.',
      },
      data: emptyPuckBlockData,
      slots: {},
      className: 'styled-block',
    })
  );

describe('TitleRender', () => {
  it('shows the title, pre-title and lead from the stored props', () => {
    renderTitle();

    expect(
      screen.getByRole('heading', { name: 'Election night' })
    ).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(
      screen.getByText('All results as they come in.')
    ).toBeInTheDocument();
  });

  it('puts the class name on its single root element', () => {
    const { container } = renderTitle();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass('styled-block');
  });
});
