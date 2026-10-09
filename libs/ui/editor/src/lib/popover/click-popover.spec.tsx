import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ClickPopover } from './click-popover';

const theme = createTheme();

const renderPopover = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ClickPopover
        trigger={<button type="button">Open</button>}
        {...props}
      >
        <p>Really delete this?</p>
      </ClickPopover>
    </ThemeProvider>
  );

describe('ClickPopover', () => {
  it('keeps the content hidden until the trigger is clicked', () => {
    renderPopover();

    expect(screen.queryByText('Really delete this?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByText('Really delete this?')).toBeInTheDocument();
  });

  it('closes when the user clicks away', async () => {
    const { baseElement } = renderPopover();

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByText('Really delete this?')).toBeInTheDocument();

    const backdrop = baseElement.querySelector('.MuiBackdrop-root');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);

    // MUI keeps the surface mounted for its exit transition.
    await waitFor(() =>
      expect(screen.queryByText('Really delete this?')).not.toBeInTheDocument()
    );
  });

  it('hands the content a close callback', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ClickPopover trigger={<button type="button">Open</button>}>
          {close => (
            <button
              type="button"
              onClick={close}
            >
              Confirm
            </button>
          )}
        </ClickPopover>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Confirm' })
      ).not.toBeInTheDocument()
    );
  });
});
