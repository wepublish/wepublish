import { useColorScheme } from '@mui/material';
import { useCallback } from 'react';

export type ColorMode = 'light' | 'dark';
export type ColorModePreference = ColorMode | 'system';

export const useColorMode = () => {
  const { mode, systemMode, setMode } = useColorScheme();

  const setPreference = useCallback(
    (preference: ColorModePreference) => setMode(preference),
    [setMode]
  );

  return {
    preference: (mode ?? 'system') as ColorModePreference,
    mode: ((mode === 'system' ? systemMode : mode) ?? 'light') as ColorMode,
    setPreference,
  };
};
