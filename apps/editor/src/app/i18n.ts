import { format as formatDate, isDate, Locale } from 'date-fns';
import {
  de as deLocale,
  enGB as enLocale,
  fr as frLocale,
} from 'date-fns/locale';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import { initReactI18next } from 'react-i18next';

import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

const dateFormatMap = new Map<string, Locale>([
  ['de', deLocale],
  ['en', enLocale],
  ['fr', frLocale],
]);

export const initI18N = () => {
  i18n.init({
    interpolation: {
      format: (value, format, lng = 'en') => {
        if (isDate(value) && format !== undefined) {
          const myLocale = dateFormatMap.get(lng);
          return formatDate(value, format, { locale: myLocale });
        }
        return value;
      },
    },
  });

  i18n.use(LanguageDetector).use(initReactI18next).init({
    fallbackLng: 'en',
    debug: false,
    resources: {
      en,
      de,
      fr,
    },
  });

  // TODO: how to handle other date and time formats
  registerLocale('de', deLocale);
  setDefaultLocale('de');
};
