import { createTheme } from '@mui/material';
import type { CssVarsTheme, Theme } from '@mui/material/styles';

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

const lightSurfaces = {
  background: { default: '#f3f4f7', paper: '#ffffff' },
};

const darkSurfaces = {
  background: { default: '#0a0d12', paper: '#14181f' },
  text: { primary: '#e9ebf0', secondary: '#a4a9b3', disabled: '#6a6f76' },
  divider: '#3c3f43',
};

const ALERT_TONES = {
  light: {
    success: { backgroundColor: '#e1f8de', color: '#2f6b2a' },
    warning: { backgroundColor: '#f8efde', color: '#85560f' },
    error: { backgroundColor: '#f8dede', color: '#8f2f2f' },
    info: { backgroundColor: '#dee9f8', color: '#2f4f8f' },
  },
  dark: {
    success: { backgroundColor: '#23402a', color: '#a8e2a2' },
    warning: { backgroundColor: '#463a22', color: '#f0cf8f' },
    error: { backgroundColor: '#46282a', color: '#f2b8b8' },
    info: { backgroundColor: '#22304a', color: '#a8c6f0' },
  },
} as const;

type Tone = { backgroundColor: string; color: string };

const alertSurface = (tone: Tone, variant?: string) => ({
  color: tone.color,
  '& .MuiAlert-icon, & .MuiAlert-action': { color: tone.color },
  ...(variant === 'outlined' ?
    { borderColor: tone.color }
  : { backgroundColor: tone.backgroundColor }),
});

const alertOverrides = () => ({
  root: ({
    ownerState,
    theme,
  }: {
    ownerState: { severity?: string; variant?: string };
    theme: Omit<Theme, 'palette' | 'components'> & CssVarsTheme;
  }) => {
    const severity = ownerState.severity as keyof (typeof ALERT_TONES)['light'];
    const tone = ALERT_TONES.light[severity];

    if (!tone) {
      return {};
    }

    return {
      ...alertSurface(tone, ownerState.variant),
      ...theme.applyStyles(
        'dark',
        alertSurface(ALERT_TONES.dark[severity], ownerState.variant)
      ),
    };
  },
});

const editorPalette = (mode: ColorMode) => ({
  mode,
  ...(mode === 'dark' ? darkSurfaces : lightSurfaces),
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
      light: '#f8def2',
      main: '#d06ab8',
      dark: '#9c4d8a',
    },
  }),
  success: augmentColor({
    color: {
      light: '#e1f8de',
      main: '#52ad4a',
      dark: '#3d8237',
    },
  }),
  warning: augmentColor({
    color: {
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
});

export const createEditorTheme = () =>
  createTheme({
    cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' },
    colorSchemes: {
      light: { palette: editorPalette('light') },
      dark: { palette: editorPalette('dark') },
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
      h1: { fontSize: '1.875rem', lineHeight: '2.375rem', fontWeight: 650 },
      h2: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 650 },
      h3: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 650 },
      h4: { fontSize: '1.0625rem', lineHeight: '1.5rem', fontWeight: 650 },
      h5: { fontSize: '0.9375rem', lineHeight: '1.375rem', fontWeight: 650 },
      h6: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 650 },
    },
    components: {
      MuiTextField: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiAutocomplete: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiTabs: {
        defaultProps: {},
        styleOverrides: {
          root: ({ theme }) => ({
            minHeight: 40,
            position: 'relative',
            '& .MuiTabs-scrollButtons': {
              position: 'absolute',
              top: 0,
              bottom: 0,
              opacity: 1,
              background: theme.vars.palette.background.paper,
              zIndex: 500,
              '&:first-of-type': {
                left: 0,
              },
              '&:last-of-type': {
                right: 0,
              },
            },
            '& .MuiTabs-scrollButtons.Mui-disabled': {
              display: 'none',
            },
          }),
        },
      },
      MuiTab: {
        defaultProps: {},
        styleOverrides: {
          root: ({ theme }) => ({
            minHeight: 40,
            paddingBlock: theme.spacing(1),
            textTransform: 'none',
          }),
        },
      },
      MuiFormControl: {
        defaultProps: {
          margin: 'none',
          size: 'small',
        },
      },
      MuiSelect: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiCardHeader: {
        defaultProps: {
          slotProps: {
            title: { component: 'div' as 'span' },
          },
        },
        styleOverrides: {
          action: {
            alignSelf: 'center',
            margin: 0,
          },
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableTouchRipple: true,
        },
      },
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
      MuiDrawer: {
        styleOverrides: {
          paper: {
            display: 'flex',
            flexDirection: 'column',
          },
        },
      },
      MuiAlert: {
        styleOverrides: alertOverrides(),
      },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderBottomColor: theme.vars.palette.divider,
          }),
        },
      },
      MuiCard: {
        defaultProps: {
          variant: 'outlined',
        },
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: theme.shape.borderRadius,
          }),
        },
      },
      MuiAccordion: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiListItem: {
        defaultProps: {
          dense: true,
        },
      },
    },
  });
