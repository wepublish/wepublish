import { useColorScheme, useTheme } from '@mui/material';

export const useDarkMode = () => {
  const { palette } = useTheme();
  const { mode, systemMode } = useColorScheme();

  return (
    palette.mode === 'dark' ||
    (mode === 'system' ? systemMode : mode) === 'dark'
  );
};
