import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ClickPopover } from './click-popover';

const theme = createTheme({ cssVariables: true });

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

  it('tells assistive technology what the trigger opens', () => {
    renderPopover();

    const trigger = screen.getByRole('button', { name: 'Open' });

    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(
      document.getElementById(trigger.getAttribute('aria-controls') ?? '')
    ).toContainElement(screen.getByText('Really delete this?'));
  });

  it('names the open popover after its trigger', () => {
    renderPopover();

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog', { name: 'Open' })).toContainElement(
      screen.getByText('Really delete this?')
    );
  });

  it('closes when the user clicks away', async () => {
    const { baseElement } = renderPopover();

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByText('Really delete this?')).toBeInTheDocument();

    const backdrop = baseElement.querySelector('.MuiBackdrop-root');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);

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
