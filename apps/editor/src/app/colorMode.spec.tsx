import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

import {
  COLOR_MODE_STORAGE_KEY,
  ColorModeProvider,
  useColorMode,
} from './colorMode';

type ChangeListener = (event: { matches: boolean }) => void;

const mockSystemPreference = (prefersDark: boolean) => {
  const listeners = new Set<ChangeListener>();
  const mediaQuery = {
    matches: prefersDark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, listener: ChangeListener) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: ChangeListener) =>
      listeners.delete(listener),
  };

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mediaQuery)
  );

  return {
    change: (dark: boolean) => {
      mediaQuery.matches = dark;
      listeners.forEach(listener => listener({ matches: dark }));
    },
  };
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <ColorModeProvider>{children}</ColorModeProvider>
);

describe('useColorMode', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('follows a dark operating system when nothing was chosen', () => {
    mockSystemPreference(true);

    const { result } = renderHook(() => useColorMode(), { wrapper });

    expect(result.current.preference).toBe('system');
    expect(result.current.mode).toBe('dark');
  });

  it('follows a light operating system when nothing was chosen', () => {
    mockSystemPreference(false);

    const { result } = renderHook(() => useColorMode(), { wrapper });

    expect(result.current.mode).toBe('light');
  });

  it('switches live when the operating system changes', () => {
    const system = mockSystemPreference(false);

    const { result } = renderHook(() => useColorMode(), { wrapper });

    act(() => system.change(true));

    expect(result.current.mode).toBe('dark');
  });

  it('lets a stored choice override the operating system', () => {
    mockSystemPreference(false);
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'dark');

    const { result } = renderHook(() => useColorMode(), { wrapper });

    expect(result.current.preference).toBe('dark');
    expect(result.current.mode).toBe('dark');
  });

  it('remembers a choice and stops following the operating system', () => {
    const system = mockSystemPreference(true);

    const { result } = renderHook(() => useColorMode(), { wrapper });

    act(() => result.current.setPreference('light'));
    act(() => system.change(true));

    expect(result.current.mode).toBe('light');
    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe('light');
  });

  it('falls back to the operating system for an unknown stored value', () => {
    mockSystemPreference(true);
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'purple');

    const { result } = renderHook(() => useColorMode(), { wrapper });

    expect(result.current.preference).toBe('system');
    expect(result.current.mode).toBe('dark');
  });
});
