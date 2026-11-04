import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import { PartialDeep } from 'type-fest';

const rubik = { family: 'Rubik' };

const {
  palette: { augmentColor },
} = WePTheme;

const theme = createTheme(WePTheme, {
  palette: {
    primary: augmentColor({ color: { main: '#000000' } }),
    secondary: augmentColor({ color: { main: '#000000' } }),
    accent: augmentColor({ color: { main: '#FF00AC' } }),
    background: { default: '#FFFAEF' },
  },
  typography: {
    h1: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
    },
    h2: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
    },
    h3: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
    },
    h4: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
    },
    h5: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
    },
    h6: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
    },
    body1: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
      fontSize: '16px',
    },
    body2: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
    },
    button: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
    },
    subtitle2: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
    },
    allVariants: {
      fontFamily: [rubik.family, 'sans-serif'].join(','),
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedSizeLarge: () => ({
          padding: `${WePTheme.spacing(1.5)} ${WePTheme.spacing(3)}`,
          fontSize: '1.1em',
        }),
      },
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export { theme as default };
