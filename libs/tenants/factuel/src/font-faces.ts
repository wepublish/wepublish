import courantSansBold from './fonts/body/CourantSans-Std-Bold.woff2';
import courantSansBoldItalic from './fonts/body/CourantSans-Std-BoldItalic.woff2';
import courantSansCaptions from './fonts/body/CourantSans-Captions.woff2';
import courantSansCaptionsItalic from './fonts/body/CourantSans-Captions-Italic.woff2';
import courantSansKicker from './fonts/body/CourantSans-Kicker.woff2';
import courantSansMedium from './fonts/body/CourantSans-Std-Medium.woff2';
import courantSansMediumItalic from './fonts/body/CourantSans-Std-MediumItalic.woff2';
import ftDCondMed from './fonts/display/FtDCondMed.woff2';
import featureBold from './fonts/editorial/FeatureFlatDeck-Bold-Web.woff2';
import featureBoldItalic from './fonts/editorial/FeatureFlatDeck-BoldItalic-Web.woff2';
import featureExtrabold from './fonts/editorial/FeatureFlatDeck-Extrabold-Web.woff2';
import featureExtraboldItalic from './fonts/editorial/FeatureFlatDeck-ExtraboldItalic-Web.woff2';
import featureLight from './fonts/editorial/FeatureFlatDeck-Light-Web.woff2';
import featureLightItalic from './fonts/editorial/FeatureFlatDeck-LightItalic-Web.woff2';
import featureMedium from './fonts/editorial/FeatureFlatDeck-Medium-Web.woff2';
import featureMediumItalic from './fonts/editorial/FeatureFlatDeck-MediumItalic-Web.woff2';
import featureRegular from './fonts/editorial/FeatureFlatDeck-Regular-Web.woff2';
import featureRegularItalic from './fonts/editorial/FeatureFlatDeck-RegularItalic-Web.woff2';

export type CourantFontFace = {
  src: string;
  weight: number;
  style: 'normal' | 'italic';
};

export type CourantFont = {
  family: string;
  faces: CourantFontFace[];
};

export const displaySerif: CourantFont = {
  family: 'CourantDisplay',
  faces: [{ src: ftDCondMed, weight: 500, style: 'normal' }],
};

// The Medium cuts are the brand's regular body weight, mapped on purpose to CSS 400.
export const bodySans: CourantFont = {
  family: 'CourantSans',
  faces: [
    { src: courantSansMedium, weight: 400, style: 'normal' },
    { src: courantSansMediumItalic, weight: 400, style: 'italic' },
    { src: courantSansBold, weight: 700, style: 'normal' },
    { src: courantSansBoldItalic, weight: 700, style: 'italic' },
  ],
};

export const bodySansCaptions: CourantFont = {
  family: 'CourantSansCaptions',
  faces: [
    { src: courantSansCaptions, weight: 400, style: 'normal' },
    { src: courantSansCaptionsItalic, weight: 400, style: 'italic' },
  ],
};

export const bodySansKicker: CourantFont = {
  family: 'CourantSansKicker',
  faces: [{ src: courantSansKicker, weight: 400, style: 'normal' }],
};

export const editorialSerif: CourantFont = {
  family: 'CourantEditorial',
  faces: [
    { src: featureLight, weight: 300, style: 'normal' },
    { src: featureLightItalic, weight: 300, style: 'italic' },
    { src: featureRegular, weight: 400, style: 'normal' },
    { src: featureRegularItalic, weight: 400, style: 'italic' },
    { src: featureMedium, weight: 500, style: 'normal' },
    { src: featureMediumItalic, weight: 500, style: 'italic' },
    { src: featureBold, weight: 700, style: 'normal' },
    { src: featureBoldItalic, weight: 700, style: 'italic' },
    { src: featureExtrabold, weight: 800, style: 'normal' },
    { src: featureExtraboldItalic, weight: 800, style: 'italic' },
  ],
};

export const courantFonts: CourantFont[] = [
  displaySerif,
  bodySans,
  bodySansCaptions,
  bodySansKicker,
  editorialSerif,
];
