import i18next, { Resource } from 'i18next';

import LanguageDetector from 'i18next-browser-languagedetector';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { mergeDeepRight, map, pick } from 'ramda';

import de from '@wepublish/website/translations/de.json';
import fr from '@wepublish/website/translations/fr.json';

const translations: Resource = {
  de,
  fr,
};

export function initWePublishTranslator(overrides: object = {}) {
  i18next
    .use(ICU)
    .use(LanguageDetector)
    .use(initReactI18next)
    .use(
      resourcesToBackend((locale: string) =>
        mergeDeepRight(translations[locale], overrides)
      )
    )
    .init({
      partialBundledLanguages: true,
      lng: 'de',
      fallbackLng: 'de',
      supportedLngs: Object.keys(translations),
      interpolation: {
        escapeValue: false,
      },
      resources: map(pick(['zod']), translations) as Resource,
    });

  return i18next;
}
