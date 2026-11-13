import {
  applyTranslationOverrides,
  initWePublishTranslator,
  TranslationOverridesByLocale,
} from '@wepublish/utils/website';
import { i18n } from 'i18next';

/**
 * Loads the texts of both languages, each with the overrides of the site in
 * that language (the site is the only one in German and French).
 */
export const setUpTranslations = (overrides: TranslationOverridesByLocale) =>
  applyTranslationOverrides(initWePublishTranslator(), overrides);

/** The language of a page from its address: /fr is French, the rest German */
export const pageLanguage = (locale?: string) =>
  locale === 'fr' ? 'fr' : 'de';

/** Shows the texts of the site in the language of the page */
export const syncPageLanguage = (i18n: i18n, locale?: string) => {
  const language = pageLanguage(locale);

  if (i18n.language !== language) {
    void i18n.changeLanguage(language);
  }
};
