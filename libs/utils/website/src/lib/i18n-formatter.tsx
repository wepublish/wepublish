// an import cannot load a .d.ts; the reference brings the subpath's types to
// every app that compiles this file through its path aliases
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./i18next-icu-cjs.d.ts" />
import i18next, { Resource } from 'i18next';

import LanguageDetector from 'i18next-browser-languagedetector';
// The ES build default-imports intl-messageformat, a CommonJS package without
// ESM exports: under Node (server rendering) that import is the module object,
// so every message fails to format and is rendered as its raw template. The
// CommonJS build imports it correctly in Node and in the bundles.
import ICU from 'i18next-icu/cjs';
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
