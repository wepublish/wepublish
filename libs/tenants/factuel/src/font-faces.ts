import localFont from 'next/font/local';

export const displaySerif = localFont({
  src: [
    {
      path: './fonts/display/FtDCondMed.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
});

// The Medium cuts are the brand's regular body weight, mapped on purpose to CSS 400.
export const bodySans = localFont({
  src: [
    {
      path: './fonts/body/CourantSans-Std-Medium.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/body/CourantSans-Std-MediumItalic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/body/CourantSans-Std-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/body/CourantSans-Std-BoldItalic.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
});

export const bodySansCaptions = localFont({
  src: [
    {
      path: './fonts/body/CourantSans-Captions.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/body/CourantSans-Captions-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
  ],
});

export const bodySansKicker = localFont({
  src: [
    {
      path: './fonts/body/CourantSans-Kicker.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
});

export const editorialSerif = localFont({
  src: [
    {
      path: './fonts/editorial/FeatureFlatDeck-Light-Web.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/editorial/FeatureFlatDeck-LightItalic-Web.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: './fonts/editorial/FeatureFlatDeck-Regular-Web.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/editorial/FeatureFlatDeck-RegularItalic-Web.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/editorial/FeatureFlatDeck-Medium-Web.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/editorial/FeatureFlatDeck-MediumItalic-Web.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: './fonts/editorial/FeatureFlatDeck-Bold-Web.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/editorial/FeatureFlatDeck-BoldItalic-Web.woff2',
      weight: '700',
      style: 'italic',
    },
    {
      path: './fonts/editorial/FeatureFlatDeck-Extrabold-Web.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: './fonts/editorial/FeatureFlatDeck-ExtraboldItalic-Web.woff2',
      weight: '800',
      style: 'italic',
    },
  ],
});
