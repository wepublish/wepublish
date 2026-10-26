import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';

import { TeaserGridFlexBlock } from './teaserGridFlexBlock';
import { TeaserGridFlexBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

describe('TeaserGridFlexBlock', () => {
  it('offers adding a tile as a labelled button', () => {
    render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <TeaserGridFlexBlock
            type={EditorBlockType.TeaserGridFlex}
            value={
              {
                title: '',
                flexTeasers: [],
              } as unknown as TeaserGridFlexBlockValue
            }
            onChange={vi.fn()}
          />
        </ThemeProvider>
      </MockedProvider>
    );

    expect(screen.getByText('blocks.flexTeaser.addBlock')).toBeVisible();
  });

  it('keeps the tile actions inside the tile', () => {
    const { container } = render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <TeaserGridFlexBlock
            type={EditorBlockType.TeaserGridFlex}
            value={
              {
                title: '',
                flexTeasers: [
                  {
                    alignment: { i: 'tile-1', x: 0, y: 0, w: 3, h: 6 },
                    teaser: null,
                  },
                ],
              } as unknown as TeaserGridFlexBlockValue
            }
            onChange={vi.fn()}
          />
        </ThemeProvider>
      </MockedProvider>
    );

    const tile = within(
      container.querySelector<HTMLElement>('.react-grid-item')!
    );

    expect(
      tile.getByRole('button', { name: 'listInput.dragToReorder' })
    ).toBeInTheDocument();
    expect(
      tile.getByRole('button', { name: 'blocks.flexTeaser.removeBlock' })
    ).toBeInTheDocument();
    expect(
      tile.getByRole('button', { name: 'blocks.flexTeaser.lockBlock' })
    ).toBeInTheDocument();
  });

  it('offers adding a tile as a text button below the grid', () => {
    const { container } = render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <TeaserGridFlexBlock
            type={EditorBlockType.TeaserGridFlex}
            value={
              {
                title: '',
                flexTeasers: [],
              } as unknown as TeaserGridFlexBlockValue
            }
            onChange={vi.fn()}
          />
        </ThemeProvider>
      </MockedProvider>
    );

    const add = screen.getByRole('button', {
      name: 'blocks.flexTeaser.addBlock',
    });

    expect(add).toHaveClass('MuiButton-text');
    expect(
      container
        .querySelector('.react-grid-layout')!
        .compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
