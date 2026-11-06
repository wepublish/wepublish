import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { MailColorPicker } from './color-picker';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(() => ({ data: undefined, loading: false })),
}));

const renderPicker = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MailColorPicker
        value="#336699"
        title="Text color"
        onChange={vi.fn()}
      />
    </ThemeProvider>
  );

describe('MailColorPicker', () => {
  it('opens a named dialog that takes focus and gives it back on Escape', async () => {
    renderPicker();

    const swatch = screen.getByRole('button', { name: 'Text color' });
    expect(swatch).toHaveAttribute('aria-haspopup', 'dialog');

    swatch.focus();
    fireEvent.keyDown(swatch, { key: 'Enter' });

    const dialog = await screen.findByRole('dialog', { name: 'Text color' });
    await waitFor(() =>
      expect(dialog.contains(document.activeElement)).toBe(true)
    );

    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(swatch).toHaveFocus());
  });
});
