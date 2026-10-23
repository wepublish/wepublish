import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MdDelete } from 'react-icons/md';

import { FLEX_TILE_DRAG_HANDLE, FlexTile } from './flexTile';

const theme = createTheme({ cssVariables: true });

const renderTile = (locked = false, extra: Record<string, boolean> = {}) => {
  const onDelete = vi.fn();

  render(
    <ThemeProvider theme={theme}>
      <FlexTile
        locked={locked}
        {...extra}
        actions={[{ label: 'Delete', icon: <MdDelete />, onClick: onDelete }]}
      >
        <p>Content</p>
      </FlexTile>
    </ThemeProvider>
  );

  return onDelete;
};

describe('FlexTile', () => {
  it('shows its content with the actions on top of it', () => {
    const onDelete = renderTile();

    expect(screen.getByText('Content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalled();
  });

  it('offers a drag handle while unlocked', () => {
    renderTile();

    expect(
      screen.getByRole('button', { name: 'listInput.dragToReorder' })
    ).toHaveClass(FLEX_TILE_DRAG_HANDLE);
  });

  it('hides the drag handle once locked', () => {
    renderTile(true);

    expect(
      screen.queryByRole('button', { name: 'listInput.dragToReorder' })
    ).toBeNull();
  });

  it('offers the actions in a menu for small tiles', () => {
    const onDelete = renderTile();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'flexTile.moreActions',
        hidden: true,
      })
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalled();
  });

  it('marks empty and hidden tiles', () => {
    renderTile(false, { empty: true, dimmed: true });

    const tile = screen.getByText('Content').parentElement!;

    expect(tile).toHaveAttribute('data-empty', 'true');
    expect(tile).toHaveAttribute('data-dimmed', 'true');
  });
});
