import i18next from 'i18next';

import LanguageDetector from 'i18next-browser-languagedetector';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';
import deTranlations from '@wepublish/website/translations/de.json';
import resourcesToBackend from 'i18next-resources-to-backend';
import { mergeDeepRight } from 'ramda';

export function initWePublishTranslator(deOverriden: object = {}) {
  i18next
    .use(ICU)
    .use(LanguageDetector)
    .use(initReactI18next)
    .use(resourcesToBackend(() => mergeDeepRight(deTranlations, deOverriden)))
    .init({
      partialBundledLanguages: true,
      lng: 'de',
      fallbackLng: 'de',
      supportedLngs: ['de'],
      interpolation: {
        escapeValue: false,
      },
      resources: {
        de: { zod: deTranlations.zod },
      },
    });

  return i18next;
}
