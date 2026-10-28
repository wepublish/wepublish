import { screen } from '@testing-library/react';
import {
  mockImage,
  mockImageBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { t } from 'i18next';
import { ImageBlock } from './image-block';

const captionText = (caption: string, source: string) =>
  t('image.caption', { caption, source: source || 'EMPTY' })
    .replace(/<[^>]+>/g, '')
    .trim();

describe('ImageBlock', () => {
  it('shows the image with caption and source', () => {
    renderWithProviders(
      <ImageBlock
        {...mockImageBlock({
          caption: 'Protest in Bern',
          image: mockImage({ description: 'Crowd', source: 'Keystone' }),
        })}
      />
    );

    expect(screen.getByRole('img', { name: 'Crowd' })).toBeInTheDocument();
    expect(screen.getByRole('figure')).toHaveTextContent(
      captionText('Protest in Bern', 'Keystone')
    );
  });

  it('shows only the source when there is no caption', () => {
    renderWithProviders(
      <ImageBlock
        {...mockImageBlock({
          caption: '',
          image: mockImage({ source: 'Keystone' }),
        })}
      />
    );

    expect(screen.getByRole('figure')).toHaveTextContent(
      captionText('', 'Keystone')
    );
  });

  it('shows only the caption when the image has no source', () => {
    renderWithProviders(
      <ImageBlock
        {...mockImageBlock({
          caption: 'Protest in Bern',
          image: mockImage({ source: '' }),
        })}
      />
    );

    expect(screen.getByRole('figure')).toHaveTextContent(/^Protest in Bern$/);
  });

  it('shows no caption without caption and source', () => {
    const { container } = renderWithProviders(
      <ImageBlock
        {...mockImageBlock({ caption: '', image: mockImage({ source: '' }) })}
      />
    );

    expect(container.querySelector('figcaption')).not.toBeInTheDocument();
  });

  it('links the image to the given URL in a new tab', () => {
    renderWithProviders(
      <ImageBlock
        {...mockImageBlock({
          linkUrl: 'https://example.com/gallery',
          image: mockImage({ description: 'Crowd' }),
        })}
      />
    );

    const link = screen.getByRole('link', { name: 'Crowd' });

    expect(link).toHaveAttribute('href', 'https://example.com/gallery');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('does not link the image without a URL', () => {
    renderWithProviders(<ImageBlock {...mockImageBlock({ linkUrl: null })} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
