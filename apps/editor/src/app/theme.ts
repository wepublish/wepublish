import { createTheme } from '@mui/material';

import type { ColorMode } from './colorMode';

/**
 * Corporate design colours used throughout the editor.
 *
 * The pastels (light shades) come directly from the StateColor enum used for
 * article/page status badges. Darker main/dark variants are derived from the
 * same hue so every palette family is internally consistent.
 *
 *  blue   #3498ff  – primary brand colour (buttons, links, focus rings)
 *  pink   #f8def2  – pending state background  → secondary palette
 *  green  #e1f8de  – published state background → success palette
 *  cream  #f8efde  – draft state background     → warning palette
 */

const {
  palette: { augmentColor },
} = createTheme();

export const EDITOR_FONT_FAMILY =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const darkSurfaces = {
  background: { default: '#0f131a', paper: '#1a1d24' },
  text: { primary: '#e9ebf0', secondary: '#a4a9b3', disabled: '#6a6f76' },
  divider: '#3c3f43',
};

export const createEditorTheme = (mode: ColorMode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'dark' ? darkSurfaces : {}),
      primary: augmentColor({
        color: {
          light: '#76bcff',
          main: '#3498ff',
          dark: '#1a7ee0',
          contrastText: '#ffffff',
        },
      }),
      secondary: augmentColor({
        color: {
          // pink family — derived from #f8def2 (HSL ≈ 315° 79% 92%)
          light: '#f8def2',
          main: '#d06ab8',
          dark: '#9c4d8a',
        },
      }),
      success: augmentColor({
        color: {
          // green family — derived from #e1f8de (HSL ≈ 115° 67% 92%)
          light: '#e1f8de',
          main: '#52ad4a',
          dark: '#3d8237',
        },
      }),
      warning: augmentColor({
        color: {
          // cream/amber family — derived from #f8efde (HSL ≈ 38° 80% 92%)
          light: '#f8efde',
          main: '#e8a030',
          dark: '#b87820',
        },
      }),
      accent: augmentColor({
        color: {
          main: '#F5FF64',
          light: '#A4EFEF',
        },
      }),
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: EDITOR_FONT_FAMILY,
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: 'var(--rs-border-primary)',
          },
        },
      },
    },
  });
