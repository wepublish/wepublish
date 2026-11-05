import { css, GlobalStyles, Theme } from '@mui/material';

import euclidBold from '../fonts/euclid/EuclidCircularB-Bold-WebS.woff2';
import euclidLight from '../fonts/euclid/EuclidCircularB-Light-WebS.woff2';
import euclidLightItalic from '../fonts/euclid/EuclidCircularB-LightItalic-WebS.woff2';
import euclidMedium from '../fonts/euclid/EuclidCircularB-Medium-WebS.woff2';
import euclidMediumItalic from '../fonts/euclid/EuclidCircularB-MediumItalic-WebS.woff2';
import recifeBold from '../fonts/recife/RecifeTextWeb-Bold.woff2';
import recifeRegular from '../fonts/recife/RecifeTextWeb-Regular.woff2';
import recifeRegularItalic from '../fonts/recife/RecifeTextWeb-RegularItalic.woff2';
import robotoMonoRegular from '../fonts/roboto/RobotoMono-Regular.woff2';
import { euclidCircularB, recife, robotoMono } from '../theme';

const fontFace = (
  family: string,
  src: string,
  weight: number,
  style: 'normal' | 'italic'
) => css`
  @font-face {
    font-family: ${family};
    src: url(${src}) format('woff2');
    font-weight: ${weight};
    font-style: ${style};
    font-display: swap;
  }
`;

export const reflektFontFiles = [
  recifeRegular,
  recifeRegularItalic,
  recifeBold,
  euclidLight,
  euclidLightItalic,
  euclidMedium,
  euclidMediumItalic,
  euclidBold,
  robotoMonoRegular,
];

const fontFaces = [
  fontFace(recife.family, recifeRegular, 400, 'normal'),
  fontFace(recife.family, recifeRegularItalic, 400, 'italic'),
  fontFace(recife.family, recifeBold, 700, 'normal'),
  fontFace(euclidCircularB.family, euclidLight, 300, 'normal'),
  fontFace(euclidCircularB.family, euclidLightItalic, 300, 'italic'),
  fontFace(euclidCircularB.family, euclidMedium, 400, 'normal'),
  fontFace(euclidCircularB.family, euclidMediumItalic, 400, 'italic'),
  fontFace(euclidCircularB.family, euclidBold, 700, 'normal'),
  fontFace(robotoMono.family, robotoMonoRegular, 400, 'normal'),
];

const globalCSS = (theme: Theme) => css`
  ${fontFaces}

  :root {
    --navbar-bg-color-hero-off-screen: transparent;
    --breakpoint-width: min(${theme.breakpoints.values.lg}px, 100vw);

    ${theme.breakpoints.up('md')} {
      --navbar-bg-color-hero-off-screen: ${theme.palette.common.white};
    }
  }

  .MuiTypography-root:has(
    .MuiTypography-buttonLinkSecondary,
    .MuiTypography-buttonLinkMain
  ) {
    text-align: center;
  }
`;

export const ReflektGlobalStyles = () => <GlobalStyles styles={globalCSS} />;
