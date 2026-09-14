import websiteTranslations from '@wepublish/website/translations/de.json';
import i18next from 'i18next';
import ICU from 'i18next-icu';

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
