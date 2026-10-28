import { createTheme, ThemeProvider } from '@mui/material';
import { HotkeyManager } from '@tanstack/react-hotkeys';
import { render, screen } from '@testing-library/react';

import { CommandPaletteTrigger } from './commandPaletteTrigger';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

const renderOn = (platform: string) => {
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
  HotkeyManager.resetInstance();

  return render(
    <ThemeProvider theme={theme}>
      <CommandPaletteTrigger />
    </ThemeProvider>
  );
};

afterEach(() => {
  vi.restoreAllMocks();
  HotkeyManager.resetInstance();
});

describe('CommandPaletteTrigger', () => {
  it('shows the command symbol on a Mac', () => {
    renderOn('MacIntel');

    expect(screen.getByRole('button')).toHaveTextContent('⌘ K');
  });

  it('spells out Ctrl everywhere else', () => {
    renderOn('Win32');

    expect(screen.getByRole('button')).toHaveTextContent('Ctrl+K');
  });
});
