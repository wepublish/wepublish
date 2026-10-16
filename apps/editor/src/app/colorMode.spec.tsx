import { ThemeProvider } from '@mui/material';
import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

import { useColorMode } from './colorMode';
import { createEditorTheme } from './theme';

const theme = createEditorTheme();

const mockSystemPreference = (prefersDark: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn((media: string) => ({
      matches: media.includes('dark') ? prefersDark : false,
      media,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }))
  );

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider
    theme={theme}
    defaultMode="system"
    noSsr
  >
    {children}
  </ThemeProvider>
);

const render = () => renderHook(() => useColorMode(), { wrapper });

describe('useColorMode', () => {
  beforeEach(() => {
    localStorage.clear();
    mockSystemPreference(false);
  });

  it('follows the system preference by default', () => {
    const { result } = render();

    expect(result.current.preference).toBe('system');
    expect(result.current.mode).toBe('light');
  });

  it('reads a dark system preference', () => {
    mockSystemPreference(true);

    const { result } = render();

    expect(result.current.mode).toBe('dark');
  });

  it('takes an explicit choice over the system preference', () => {
    mockSystemPreference(true);
    const { result } = render();

    act(() => result.current.setPreference('light'));

    expect(result.current.preference).toBe('light');
    expect(result.current.mode).toBe('light');
  });

  it('can be handed back to the system', () => {
    const { result } = render();

    act(() => result.current.setPreference('dark'));
    act(() => result.current.setPreference('system'));

    expect(result.current.preference).toBe('system');
    expect(result.current.mode).toBe('light');
  });

  it('marks the chosen scheme on the document', () => {
    const { result } = render();

    act(() => result.current.setPreference('dark'));

    expect(document.documentElement).toHaveAttribute(
      'data-mui-color-scheme',
      'dark'
    );
  });
});
