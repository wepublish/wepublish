import type { FullWebsiteSettingsFragment } from '@wepublish/editor/api';
import { definedOnly } from './overrides';

const keyEnabled = () => ({
  __typename: 'KeyEnabled' as const,
  enabled: false,
  key: null,
});

const paletteColor = (main: string, contrastText: string) => ({
  main,
  light: null,
  dark: null,
  contrastText,
});

export const mockWebsiteSettings = (
  overrides: Partial<FullWebsiteSettingsFragment> = {}
): FullWebsiteSettingsFragment => ({
  __typename: 'WebsiteSettings',
  analytics: {
    __typename: 'WebsiteAnalytics',
    googleAnalytics: keyEnabled(),
    googleTagManager: keyEnabled(),
    plausible: keyEnabled(),
    piwik: keyEnabled(),
  },
  mail: { __typename: 'WebsiteMail', mailchimp: keyEnabled() },
  ads: { __typename: 'WebsiteAds', sparkLoop: keyEnabled() },
  fonts: [],
  theme: {
    palette: {
      primary: paletteColor('#1976d2', '#ffffff'),
      secondary: paletteColor('#9c27b0', '#ffffff'),
      accent: paletteColor('#ff9800', '#000000'),
      info: paletteColor('#0288d1', '#ffffff'),
      success: paletteColor('#2e7d32', '#ffffff'),
      error: paletteColor('#d32f2f', '#ffffff'),
      warning: paletteColor('#ed6c02', '#ffffff'),
      text: { primary: '#212121' },
      background: { default: '#fafafa', paper: '#ffffff' },
    },
  },
  ...definedOnly(overrides),
});
