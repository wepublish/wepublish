import i18next, { i18n, Resource } from 'i18next';

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

const reportedMissingKeys = new Set<string>();

function reportMissingTranslation(
  languages: readonly string[],
  namespace: string,
  key: string
) {
  if (!i18next.hasLoadedNamespace(namespace)) {
    return;
  }

  for (const language of languages) {
    const id = `${language}:${namespace}:${key}`;

    if (reportedMissingKeys.has(id)) {
      continue;
    }

    reportedMissingKeys.add(id);

    void import('@sentry/core')
      .then(Sentry =>
        Sentry.captureMessage(`Missing translation "${key}"`, {
          level: 'error',
          tags: { 'i18n.language': language, 'i18n.namespace': namespace },
          extra: { key },
        })
      )
      .catch(() => undefined);
  }
}

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
      saveMissing: true,
      saveMissingTo: 'current',
      missingKeyHandler: reportMissingTranslation,
      resources: map(pick(['zod']), translations) as Resource,
    });

  return i18next;
}

export type TranslationOverridesByLocale = Partial<Record<string, object>>;

export async function applyTranslationOverrides(
  i18n: i18n,
  overridesByLocale: TranslationOverridesByLocale
) {
  const locales = Object.keys(translations);

  await i18n.loadLanguages(locales);

  for (const locale of locales) {
    i18n.removeResourceBundle(locale, 'translation');
    i18n.addResourceBundle(
      locale,
      'translation',
      mergeDeepRight(translations[locale], overridesByLocale[locale] ?? {}),
      true,
      true
    );
  }

  await i18n.changeLanguage(i18n.language);

  return i18n;
}
