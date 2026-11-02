import { screen } from '@testing-library/react';
import { mockImage, renderWithProviders } from '@wepublish/mocks/website';
import { createElement } from 'react';

import { emptyPuckBlockData, PuckBlockData } from '../../../blocks/block.types';
import { ImageConfigProps, ImageRender } from './image.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const harbour = mockImage({ description: 'Harbour at dawn' });
const forest = mockImage({ description: 'Forest at noon' });

const renderImage = (
  data: PuckBlockData = emptyPuckBlockData,
  props: Partial<ImageConfigProps> = {}
) =>
  renderWithProviders(
    createElement(ImageRender, {
      id: 'Image-1',
      props: { caption: 'Morning light', ...props },
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

  it('hides the caption and the image credit when captions are hidden', () => {
    const credited = mockImage({
      description: 'Harbour at dawn',
      source: 'Keystone',
    });

    const { container } = renderImage(
      { ...emptyPuckBlockData, images: [credited] },
      { hideCaption: true }
    );

    expect(
      screen.getByRole('img', { name: 'Harbour at dawn' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Morning light')).not.toBeInTheDocument();
    expect(screen.queryByText(/Keystone/)).not.toBeInTheDocument();
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('crops the image to the chosen ratio', () => {
    renderImage(
      { ...emptyPuckBlockData, images: [harbour] },
      { fit: { xs: { aspectRatio: '16:9' } } }
    );

    expect(screen.getByRole('img', { name: 'Harbour at dawn' })).toHaveStyle({
      width: '100%',
      objectFit: 'cover',
    });
  });

  it('keeps the image as it is without a ratio', () => {
    renderImage({ ...emptyPuckBlockData, images: [harbour] });

    expect(
      screen.getByRole('img', { name: 'Harbour at dawn' })
    ).not.toHaveStyle({ width: '100%' });
  });
});
