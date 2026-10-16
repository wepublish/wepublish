import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { EditorBlockType, FullImageFragment } from '@wepublish/editor/api';

import { ImageBlock } from './imageBlock';
import { ImageBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

const image = {
  id: 'image-1',
  largeURL: 'https://example.com/large.jpg',
  title: 'A portrait',
} as FullImageFragment;

const renderBlock = (value: Partial<ImageBlockValue>, onChange = vi.fn()) =>
  render(
    <MockedProvider>
      <ThemeProvider theme={theme}>
        <ImageBlock
          type={EditorBlockType.Image}
          value={{ image: null, caption: '', ...value } as ImageBlockValue}
          onChange={onChange}
        />
      </ThemeProvider>
    </MockedProvider>
  );

describe('ImageBlock', () => {
  it('offers the empty box as one button', () => {
    renderBlock({});

    expect(
      screen.getByRole('button', { name: 'chooseEditImage.chooseImage' })
    ).toBeInTheDocument();
  });

  it('contains a picked image in the box instead of cropping it', () => {
    renderBlock({ image });

    expect(screen.getByAltText('A portrait')).toHaveStyle({
      'object-fit': 'contain',
    });
  });

  it('offers choosing and editing', () => {
    renderBlock({ image });

    expect(
      screen.getByRole('button', { name: 'chooseEditImage.editImage' })
    ).toBeInTheDocument();
  });

  it('empties the block when the image is removed', () => {
    const onChange = vi.fn();
    renderBlock({ image, caption: 'A caption' }, onChange);

    fireEvent.click(
      screen.getByRole('button', { name: 'chooseEditImage.removeImage' })
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ image: null, caption: 'A caption' })
    );
  });
});
