import websiteTranslations from '@wepublish/website/translations/de.json';
import i18next from 'i18next';
import ICU from 'i18next-icu';

/**
 * The website's bundle is written in ICU message syntax while the editor's
 * uses i18next's `{{ }}` interpolation. i18next only supports one format per
 * instance, so the preview gets its own instance instead of merging bundles.
 * The preview always shows the German copy, whatever language the editor UI
 * runs in.
 */
export const websiteI18n = i18next.createInstance();

websiteI18n.use(ICU).init({
  lng: 'de',
  fallbackLng: 'de',
  supportedLngs: ['de'],
  interpolation: {
    escapeValue: false,
  },
  resources: {
    de: {
      translation: websiteTranslations,
      zod: websiteTranslations.zod,
    },
  },
});
