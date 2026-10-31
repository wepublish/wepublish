import { screen } from '@testing-library/react';
import { mockImage, renderWithProviders } from '@wepublish/mocks/website';
import { createElement } from 'react';

import { emptyPuckBlockData, PuckBlockData } from '../../../blocks/block.types';
import { ImageRender } from './image.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const harbour = mockImage({ description: 'Harbour at dawn' });
const forest = mockImage({ description: 'Forest at noon' });

const renderImage = (data: PuckBlockData = emptyPuckBlockData) =>
  renderWithProviders(
    createElement(ImageRender, {
      id: 'Image-1',
      props: { caption: 'Morning light' },
      data,
      slots: {},
      className: 'styled-block',
    })
  );

describe('ImageRender', () => {
  it('shows the first image the datasource yields with its caption', () => {
    renderImage({ ...emptyPuckBlockData, images: [harbour, forest] });

    expect(
      screen.getByRole('img', { name: 'Harbour at dawn' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'Forest at noon' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Morning light')).toBeInTheDocument();
  });

  it('shows no image until the datasource yields one', () => {
    renderImage();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('puts the class name on its single root element', () => {
    const { container } = renderImage({
      ...emptyPuckBlockData,
      images: [harbour],
    });

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass('styled-block');
  });
});
