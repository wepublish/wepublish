import { createTheme, MenuItem, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ClickMenu } from './click-menu';

const theme = createTheme({ cssVariables: true });

const renderMenu = (onPick = vi.fn()) => {
  render(
    <ThemeProvider theme={theme}>
      <ClickMenu trigger={<button type="button">Options</button>}>
        {close => [
          <MenuItem
            key="edit"
            onClick={() => {
              onPick('edit');
              close();
            }}
          >
            Edit
          </MenuItem>,
          <MenuItem
            key="replace"
            onClick={() => {
              onPick('replace');
              close();
            }}
          >
            Replace
          </MenuItem>,
        ]}
      </ClickMenu>
    </ThemeProvider>
  );
  return onPick;
};

const openMenu = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Options' }));

describe('ClickMenu', () => {
  it('keeps the menu shut until the trigger is clicked', () => {
    renderMenu();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens on the trigger and lists the items', () => {
    renderMenu();

    openMenu();

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
  });

  it('reports which item was picked', () => {
    const onPick = renderMenu();

    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Replace' }));

    expect(onPick).toHaveBeenCalledWith('replace');
  });

  it('closes once an item has been picked', async () => {
    renderMenu();

    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    );
  });

  it('tells assistive technology the trigger opens a menu', () => {
    renderMenu();

    const trigger = screen.getByRole('button', { name: 'Options' });

    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    openMenu();

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('names the open menu after its trigger', () => {
    renderMenu();

    openMenu();

    expect(screen.getByRole('menu', { name: 'Options' })).toBeInTheDocument();
  });

  it('still runs the trigger’s own click handler', () => {
    const onClick = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <ClickMenu
          trigger={
            <button
              type="button"
              onClick={onClick}
            >
              Options
            </button>
          }
        >
          <MenuItem>Edit</MenuItem>
        </ClickMenu>
      </ThemeProvider>
    );

    openMenu();

    expect(onClick).toHaveBeenCalled();
  });
});
