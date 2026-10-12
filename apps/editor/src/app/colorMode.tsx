import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ColorMode = 'light' | 'dark';
export type ColorModePreference = ColorMode | 'system';

export const COLOR_MODE_STORAGE_KEY = 'wepublish/colorMode';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const PREFERENCES: ColorModePreference[] = ['light', 'dark', 'system'];

interface ColorModeContextValue {
  preference: ColorModePreference;
  mode: ColorMode;
  setPreference: (preference: ColorModePreference) => void;
}

const ColorModeContext = createContext<ColorModeContextValue>({
  preference: 'system',
  mode: 'light',
  setPreference: () => undefined,
});

const readStoredPreference = (): ColorModePreference => {
  try {
    const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);

    return PREFERENCES.includes(stored as ColorModePreference) ?
        (stored as ColorModePreference)
      : 'system';
  } catch {
    return 'system';
  }
};

const systemPrefersDark = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia(DARK_QUERY).matches;

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] =
    useState<ColorModePreference>(readStoredPreference);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia(DARK_QUERY);
    const onChange = (event: { matches: boolean }) =>
      setSystemDark(event.matches);

    mediaQuery.addEventListener('change', onChange);

    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  const setPreference = useCallback((next: ColorModePreference) => {
    setPreferenceState(next);

    try {
      window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, next);
    } catch {
      return;
    }
  }, []);

  const mode: ColorMode =
    preference === 'system' ?
      systemDark ? 'dark'
      : 'light'
    : preference;

  const value = useMemo(
    () => ({ preference, mode, setPreference }),
    [preference, mode, setPreference]
  );

  return (
    <ColorModeContext.Provider value={value}>
      {children}
    </ColorModeContext.Provider>
  );
}

export const useColorMode = () => useContext(ColorModeContext);
