import { screen } from '@testing-library/react';
import {
  mockImage,
  mockImageGalleryBlock,
  mockImageGalleryImage,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullImageGalleryBlockFragment } from '@wepublish/website/api';
import { t } from 'i18next';
import { BlockRenderer } from '../../blocks';

const renderSlider = (images: FullImageGalleryBlockFragment['images']) =>
  renderWithProviders(
    <BlockRenderer
      block={mockImageGalleryBlock({ blockStyle: 'Slider', images })}
      index={0}
      count={1}
      type="Article"
    />
  );

describe('Slider block style for image galleries', () => {
  const images = [
    mockImageGalleryImage({
      image: mockImage({ key: '1', description: 'First image' }),
      caption: 'ABC',
    }),
    mockImageGalleryImage({
      image: mockImage({ key: '2', description: 'Second image' }),
      caption: null,
    }),
    mockImageGalleryImage({
      image: mockImage({ key: '3', description: 'Third image' }),
      caption: 'Long caption',
    }),
  ];

  it('renders a slide with caption per image', () => {
    renderSlider(images);

    expect(
      screen.getAllByRole('img').map(image => image.getAttribute('alt'))
    ).toEqual(['First image', 'Second image', 'Third image']);
    expect(screen.getByText('ABC')).toBeInTheDocument();
    expect(screen.getByText('Long caption')).toBeInTheDocument();
  });

  it('offers a navigation button per slide', async () => {
    renderSlider(images);

    for (const index of [1, 2, 3]) {
      expect(
        await screen.findByRole('button', {
          name: t('slider.slide', { index }),
        })
      ).toBeInTheDocument();
    }

    expect(
      screen.queryByRole('button', { name: t('slider.slide', { index: 4 }) })
    ).not.toBeInTheDocument();
  });

  it('renders nothing without images', () => {
    const { container } = renderSlider([]);

    expect(container).toBeEmptyDOMElement();
  });
});
