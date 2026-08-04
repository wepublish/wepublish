import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import localFont from 'next/font/local';
import { PartialDeep } from 'type-fest';

export const sabon = localFont({
  src: [
    {
      path: '../public/fonts/sabon/Linotype - SabonNextLTPro-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/sabon/Linotype - SabonNextLTPro-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    //
    {
      path: '../public/fonts/sabon/Linotype - SabonNextLTPro-Bold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/sabon/Linotype - SabonNextLTPro-BoldItalic.otf',
      weight: '600',
      style: 'italic',
    },
  ],
});

export const ttNorms = localFont({
  src: [
    {
      path: '../public/fonts/tt-norms/TypeType - TT Norms Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/tt-norms/TypeType - TT Norms Italic.otf',
      weight: '400',
      style: 'italic',
    },
    //
    {
      path: '../public/fonts/tt-norms/TypeType - TT Norms Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/tt-norms/TypeType - TT Norms Medium Italic.otf',
      weight: '500',
      style: 'italic',
    },
    //
    {
      path: '../public/fonts/tt-norms/TypeType - TT Norms Bold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/tt-norms/TypeType - TT Norms Bold Italic.otf',
      weight: '600',
      style: 'italic',
    },
  ],
});

const {
  palette: { augmentColor },
} = WePTheme;

const theme = createTheme(WePTheme, {
  palette: {
    primary: augmentColor({ color: { main: '#dc0d15' } }),
  },
  typography: {
    h1: {
      fontFamily: [sabon.style.fontFamily, 'sans-serif'].join(','),
    },
    h2: {
      fontFamily: [sabon.style.fontFamily, 'sans-serif'].join(','),
    },
    h3: {
      fontFamily: [sabon.style.fontFamily, 'sans-serif'].join(','),
    },
    h4: {
      fontFamily: [sabon.style.fontFamily, 'sans-serif'].join(','),
    },
    h5: {
      fontFamily: [sabon.style.fontFamily, 'sans-serif'].join(','),
    },
    h6: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    body1: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    body2: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    button: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    caption: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    overline: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle1: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    subtitle2: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    // Article
    articleAuthors: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    peerInformation: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    // Blocks
    blockTitlePreTitle: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    blockBreakTitle: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    blockBreakBody: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    blockQuote: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    // Teaser
    teaserTitle: {
      fontFamily: [sabon.style.fontFamily, 'sans-serif'].join(','),
    },
    teaserPretitle: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    teaserLead: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    teaserMeta: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    // Banner
    bannerTitle: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    bannerText: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    bannerCta: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
    allVariants: {
      fontFamily: [ttNorms.style.fontFamily, 'sans-serif'].join(','),
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export { theme as default };
