import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';

import { AutosaveToggle } from './autosaveToggle';
import { AUTOSAVE_ENABLED_STORAGE_KEY } from './useAutosaveEnabled';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

const renderWithTheme = (ui: ReactNode) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

beforeEach(() => localStorage.clear());

describe('AutosaveToggle', () => {
  it('is a switch, because it changes what happens right away', () => {
    renderWithTheme(<AutosaveToggle />);

    expect(
      screen.getByRole('switch', { name: 'autosave.label' })
    ).toBeChecked();
  });

  it('remembers that autosave was turned off', () => {
    renderWithTheme(<AutosaveToggle />);

    fireEvent.click(screen.getByRole('switch', { name: 'autosave.label' }));

    expect(
      screen.getByRole('switch', { name: 'autosave.label' })
    ).not.toBeChecked();
    expect(localStorage.getItem(AUTOSAVE_ENABLED_STORAGE_KEY)).toBe('false');
  });

  it('cannot be changed while the document is read only', () => {
    renderWithTheme(<AutosaveToggle disabled />);

    expect(
      screen.getByRole('switch', { name: 'autosave.label' })
    ).toBeDisabled();
  });
});
