import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import de from './locales/de.json'
import fr from './locales/fr.json'

import {format as formatDate, isDate} from 'date-fns'

import {de as deLocale, enGB as enLocale, fr as frLocale} from 'date-fns/locale'

export interface MyLocale {
  lng: string
  locale: Locale
}
const myLocales: MyLocale[] = [
  {lng: 'de', locale: deLocale},
  {lng: 'en', locale: enLocale},
  {lng: 'fr', locale: frLocale}
]

i18n.init({
  interpolation: {
    format: (value, format, lng) => {
      if (isDate(value) && format !== undefined) {
        const myLocale = myLocales.find(locale => locale.lng === lng)
        return formatDate(value, format, {locale: myLocale?.locale})
      }
      return value
    }
  }
})

i18n.use(LanguageDetector).use(initReactI18next).init({
  fallbackLng: 'en',
  debug: false,
  resources: {
    en,
    de,
    fr
  }
})

export default i18n
