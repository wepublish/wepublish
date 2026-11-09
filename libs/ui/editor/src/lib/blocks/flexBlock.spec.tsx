import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';

import { FlexBlock } from './flexBlock';
import { FlexBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

const renderBlock = () =>
  render(
    <MockedProvider>
      <ThemeProvider theme={theme}>
        <FlexBlock
          type={EditorBlockType.FlexBlock}
          value={{ blocks: [] } as unknown as FlexBlockValue}
          onChange={vi.fn()}
        />
      </ThemeProvider>
    </MockedProvider>
  );

describe('FlexBlock', () => {
  it('offers adding a block as a labelled button', () => {
    renderBlock();

    expect(screen.getByText('blocks.flexBlock.addNestedBlock')).toBeVisible();
  });

  it('lays tiles out with their saved size', () => {
    const { container } = render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <FlexBlock
            type={EditorBlockType.FlexBlock}
            value={
              {
                blocks: [
                  {
                    alignment: {
                      __typename: 'FlexAlignment',
                      i: 'tile-1',
                      x: 0,
                      y: 0,
                      w: 6,
                      h: 4,
                    },
                    block: null,
                  },
                ],
              } as FlexBlockValue
            }
            onChange={vi.fn()}
          />
        </ThemeProvider>
      </MockedProvider>
    );

    const tile = container.querySelector<HTMLElement>('.react-grid-item')!;

    expect(tile.style.height).toBe('190px');
  });

  it('keeps the tile actions inside the tile', () => {
    const { container } = render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <FlexBlock
            type={EditorBlockType.FlexBlock}
            value={
              {
                blocks: [
                  {
                    alignment: {
                      __typename: 'FlexAlignment',
                      i: 'tile-1',
                      x: 0,
                      y: 0,
                      w: 3,
                      h: 6,
                    },
                    block: null,
                  },
                ],
              } as FlexBlockValue
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
      tile.getByRole('button', { name: 'blocks.flexBlock.removeNestedBlock' })
    ).toBeInTheDocument();
    expect(
      tile.getByRole('button', { name: 'blocks.flexBlock.lockNestedBlock' })
    ).toBeInTheDocument();
  });

  it('edits a sub-block in a labelled panel with a close button', () => {
    render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <FlexBlock
            type={EditorBlockType.FlexBlock}
            value={
              {
                blocks: [
                  {
                    alignment: {
                      __typename: 'FlexAlignment',
                      i: 'tile-1',
                      x: 0,
                      y: 0,
                      w: 6,
                      h: 4,
                    },
                    block: {
                      key: 'block-1',
                      type: EditorBlockType.Title,
                      value: { title: 'Hello', lead: '', preTitle: '' },
                    },
                  },
                ],
              } as unknown as FlexBlockValue
            }
            onChange={vi.fn()}
          />
        </ThemeProvider>
      </MockedProvider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'blocks.flexBlock.editNestedBlock' })
    );

    const panel = within(
      screen.getByRole('region', { name: 'blocks.title.label' })
    );

    expect(
      panel.getByRole('button', { name: 'blocks.flexBlock.close' })
    ).toBeInTheDocument();
    expect(panel.getByDisplayValue('Hello')).toBeInTheDocument();
  });

  it('hides a sub-block from its editor panel', () => {
    const onChange = vi.fn();

    render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <FlexBlock
            type={EditorBlockType.FlexBlock}
            value={
              {
                blocks: [
                  {
                    alignment: {
                      __typename: 'FlexAlignment',
                      i: 'tile-1',
                      x: 0,
                      y: 0,
                      w: 6,
                      h: 4,
                    },
                    block: {
                      key: 'block-1',
                      type: EditorBlockType.Title,
                      value: { title: 'Hello', lead: '', preTitle: '' },
                    },
                  },
                ],
              } as unknown as FlexBlockValue
            }
            onChange={onChange}
          />
        </ThemeProvider>
      </MockedProvider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'blocks.flexBlock.editNestedBlock' })
    );
    fireEvent.click(
      within(
        screen.getByRole('region', { name: 'blocks.title.label' })
      ).getByRole('button', { name: 'blockList.hideBlock' })
    );

    expect(onChange.mock.lastCall[0].blocks[0].block.value).toMatchObject({
      disabled: true,
    });
  });

  it('times a sub-block from its editor panel', () => {
    const onChange = vi.fn();

    render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <FlexBlock
            type={EditorBlockType.FlexBlock}
            value={
              {
                blocks: [
                  {
                    alignment: {
                      __typename: 'FlexAlignment',
                      i: 'tile-1',
                      x: 0,
                      y: 0,
                      w: 6,
                      h: 4,
                    },
                    block: {
                      key: 'block-1',
                      type: EditorBlockType.Title,
                      value: { title: 'Hello', lead: '', preTitle: '' },
                    },
                  },
                ],
              } as unknown as FlexBlockValue
            }
            onChange={onChange}
          />
        </ThemeProvider>
      </MockedProvider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'blocks.flexBlock.editNestedBlock' })
    );
    fireEvent.click(
      within(
        screen.getByRole('region', { name: 'blocks.title.label' })
      ).getByRole('button', { name: 'blockList.timeBlock' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'weekday.Monday' }));

    expect(onChange.mock.lastCall[0].blocks[0].block.value).toMatchObject({
      timing: { weekdays: ['Monday'] },
    });
  });

  it('offers adding a block as a text button below the grid', () => {
    const { container } = renderBlock();

    const add = screen.getByRole('button', {
      name: 'blocks.flexBlock.addNestedBlock',
    });

    expect(add).toHaveClass('MuiButton-text');
    expect(
      container
        .querySelector('.react-grid-layout')!
        .compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
