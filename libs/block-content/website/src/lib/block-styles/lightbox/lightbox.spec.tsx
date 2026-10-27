import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockImage,
  mockImageGalleryBlock,
  mockImageGalleryImage,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullImageGalleryBlockFragment } from '@wepublish/website/api';
import { t } from 'i18next';
import { BlockRenderer } from '../../blocks';

const galleryImages = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    mockImageGalleryImage({
      image: mockImage({
        key: `${index + 1}`,
        description: `Image ${index + 1}`,
      }),
      caption: `Caption ${index + 1}`,
    })
  );

const renderLightbox = (images: FullImageGalleryBlockFragment['images']) =>
  renderWithProviders(
    <BlockRenderer
      block={mockImageGalleryBlock({ blockStyle: 'Lightbox', images })}
      index={0}
      count={1}
      type="Article"
    />
  );

describe('Lightbox block style', () => {
  it('shows every image with its caption and the position of the current one', () => {
    renderLightbox(galleryImages(3));

    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.getByText('Caption 1')).toBeInTheDocument();
    expect(screen.getByText('Caption 3')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('moves forwards and backwards with the arrows, wrapping around', async () => {
    const user = userEvent.setup();
    renderLightbox(galleryImages(3));

    await user.click(screen.getByRole('button', { name: t('lightbox.next') }));
    expect(await screen.findByText('2 / 3')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: t('lightbox.previous') })
    );
    await user.click(
      screen.getByRole('button', { name: t('lightbox.previous') })
    );
    expect(await screen.findByText('3 / 3')).toBeInTheDocument();
  });

  it('opens fullscreen, navigates with the keyboard and closes with escape', async () => {
    const user = userEvent.setup();
    const { container } = renderLightbox(galleryImages(3));

    await user.click(
      screen.getByRole('button', { name: t('lightbox.fullscreen') })
    );

    expect(container.querySelector('section')).toHaveAttribute(
      'data-fullscreen',
      'true'
    );

    await user.keyboard('{ArrowRight}');
    expect(await screen.findByText('2 / 3')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(await screen.findByText('1 / 3')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(
      await screen.findByRole('button', { name: t('lightbox.fullscreen') })
    ).toBeInTheDocument();
    expect(container.querySelector('section')).toHaveAttribute(
      'data-fullscreen',
      'false'
    );
  });

  it('leaves fullscreen with the exit button', async () => {
    const user = userEvent.setup();
    renderLightbox(galleryImages(2));

    await user.click(
      screen.getByRole('button', { name: t('lightbox.fullscreen') })
    );
    await user.click(
      screen.getByRole('button', { name: t('lightbox.exitFullscreen') })
    );

    expect(
      await screen.findByRole('button', { name: t('lightbox.fullscreen') })
    ).toBeInTheDocument();
  });

  it('ignores arrow keys outside of fullscreen', async () => {
    const user = userEvent.setup();
    renderLightbox(galleryImages(3));

    await user.keyboard('{ArrowRight}');

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('hides the arrows for a single image', () => {
    renderLightbox(galleryImages(1));

    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: t('lightbox.next') })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: t('lightbox.previous') })
    ).not.toBeInTheDocument();
  });

  it('renders nothing without images', () => {
    const { container } = renderLightbox([]);

    expect(container).toBeEmptyDOMElement();
  });
});
