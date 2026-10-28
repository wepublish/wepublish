import { screen } from '@testing-library/react';
import {
  mockImage,
  mockImageGalleryBlock,
  mockImageGalleryImage,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { t } from 'i18next';
import { ImageGalleryBlock } from './image-gallery-block';

const captionText = (caption: string, source: string) =>
  t('image.caption', { caption, source: source || 'EMPTY' })
    .replace(/<[^>]+>/g, '')
    .trim();

describe('ImageGalleryBlock', () => {
  it('shows every image with its caption and source', () => {
    renderWithProviders(
      <ImageGalleryBlock
        {...mockImageGalleryBlock({
          images: [
            mockImageGalleryImage({
              caption: 'Market square',
              image: mockImage({ description: 'Square', source: 'Keystone' }),
            }),
            mockImageGalleryImage({
              caption: 'Old town',
              image: mockImage({ description: 'Town', source: 'Reuters' }),
            }),
          ],
        })}
      />
    );

    const items = screen.getAllByRole('listitem');

    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(
      captionText('Market square', 'Keystone')
    );
    expect(items[1]).toHaveTextContent(captionText('Old town', 'Reuters'));
    expect(
      screen.getAllByRole('img').map(img => img.getAttribute('alt'))
    ).toEqual(['Square', 'Town']);
  });

  it('skips entries without an image', () => {
    renderWithProviders(
      <ImageGalleryBlock
        {...mockImageGalleryBlock({
          images: [
            mockImageGalleryImage({ caption: 'Kept' }),
            mockImageGalleryImage({ caption: 'Deleted image', image: null }),
          ],
        })}
      />
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByText(/Deleted image/)).not.toBeInTheDocument();
  });

  it('falls back to the image title without a caption', () => {
    renderWithProviders(
      <ImageGalleryBlock
        {...mockImageGalleryBlock({
          images: [
            mockImageGalleryImage({
              caption: null,
              image: mockImage({ title: 'Image title', source: '' }),
            }),
          ],
        })}
      />
    );

    expect(screen.getByRole('listitem')).toHaveTextContent(/^Image title$/);
  });

  it('shows only the source for an empty caption', () => {
    renderWithProviders(
      <ImageGalleryBlock
        {...mockImageGalleryBlock({
          images: [
            mockImageGalleryImage({
              caption: '',
              image: mockImage({ title: 'Image title', source: 'Keystone' }),
            }),
          ],
        })}
      />
    );

    expect(screen.getByRole('listitem')).toHaveTextContent(
      captionText('', 'Keystone')
    );
    expect(screen.getByRole('listitem')).not.toHaveTextContent('Image title');
  });
});
