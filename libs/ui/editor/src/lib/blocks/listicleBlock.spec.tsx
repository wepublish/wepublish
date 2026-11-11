import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';

import { ListicleBlock } from './listicleBlock';
import { ListicleBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

const renderBlock = (disabled = false) =>
  render(
    <MockedProvider>
      <ThemeProvider theme={theme}>
        <ListicleBlock
          type={EditorBlockType.Listicle}
          value={
            {
              items: [
                {
                  id: 'item-1',
                  value: { image: null, richText: undefined, title: 'First' },
                },
              ],
            } as unknown as ListicleBlockValue
          }
          onChange={vi.fn()}
          disabled={disabled}
        />
      </ThemeProvider>
    </MockedProvider>
  );

const pixels = (value: string) => Number.parseFloat(value) || Infinity;

describe('ListicleBlock', () => {
  it('shows the whole image picker instead of clipping it', () => {
    renderBlock();

    const frame = screen.getByRole('button', {
      name: 'chooseEditImage.chooseImage',
    }).parentElement!;
    const frameHeight = pixels(getComputedStyle(frame).height);

    let ancestor = frame.parentElement;

    while (ancestor && ancestor !== document.body) {
      const style = getComputedStyle(ancestor);

      if (style.overflow === 'hidden') {
        expect(pixels(style.height)).toBeGreaterThanOrEqual(frameHeight);
      }

      ancestor = ancestor.parentElement;
    }
  });

  it('disables the image picker of a disabled block', () => {
    renderBlock(true);

    expect(
      screen.getByRole('button', { name: 'chooseEditImage.chooseImage' })
    ).toBeDisabled();
  });
});
