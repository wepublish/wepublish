import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { EditorBlockType, FullImageFragment } from '@wepublish/editor/api';

import { ImageGalleryBlock } from './imageGalleryBlock';
import { ImageGalleryBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

const image = (id: string) =>
  ({
    id,
    largeURL: `https://example.com/${id}.jpg`,
    title: id,
  }) as FullImageFragment;

const gallery: ImageGalleryBlockValue = {
  images: [
    { image: image('one'), caption: 'First' },
    { image: image('two'), caption: 'Second' },
  ],
};

const renderBlock = (onChange = vi.fn()) => {
  render(
    <MockedProvider>
      <ThemeProvider theme={theme}>
        <ImageGalleryBlock
          type={EditorBlockType.ImageGallery}
          value={gallery}
          onChange={onChange}
        />
      </ThemeProvider>
    </MockedProvider>
  );

  return onChange;
};

const removeButton = () =>
  screen.getByRole('button', {
    name: 'blocks.imageGallery.overview.removeImage',
  });

describe('ImageGalleryBlock', () => {
  it('offers to remove the slide it is showing', () => {
    renderBlock();

    expect(removeButton()).toBeInTheDocument();
  });

  it('keeps the last entry', () => {
    render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <ImageGalleryBlock
            type={EditorBlockType.ImageGallery}
            value={{ images: [gallery.images[0]] }}
            onChange={vi.fn()}
          />
        </ThemeProvider>
      </MockedProvider>
    );

    expect(removeButton()).toBeDisabled();
  });

  it('takes the slide out of the gallery', () => {
    const onChange = renderBlock();

    fireEvent.click(removeButton());

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [{ image: image('two'), caption: 'Second' }],
      })
    );
  });

  it('steps back when the last slide goes', () => {
    const onChange = renderBlock();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'blocks.imageGallery.overview.nextImage',
      })
    );
    fireEvent.click(removeButton());

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [{ image: image('one'), caption: 'First' }],
      })
    );
    expect(
      screen.getByRole('button', {
        name: 'blocks.imageGallery.overview.previousImage',
      })
    ).toBeDisabled();
  });

  it('backs out of a new slide without touching the gallery', () => {
    const onChange = renderBlock();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'blocks.imageGallery.overview.addImage',
      })
    );
    expect(screen.getByText(/blocks.imageGallery.overview.new/)).toBeTruthy();

    fireEvent.click(removeButton());

    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/blocks.imageGallery.overview.new/)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'blocks.imageGallery.overview.nextImage',
      })
    ).toBeDisabled();
  });

  it('labels the gallery editor button with text', () => {
    renderBlock();

    expect(
      screen.getByText('blocks.imageGallery.panels.editGallery')
    ).toBeVisible();
  });

  it('shows which slide is visible', () => {
    renderBlock();

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });
});
