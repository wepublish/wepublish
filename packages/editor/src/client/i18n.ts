import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import {registerLocale, setDefaultLocale} from 'react-datepicker'

import dateFnsDe from 'date-fns/locale/de'

import en from './locales/en.json'
import de from './locales/de.json'
import fr from './locales/fr.json'

i18n.use(LanguageDetector).use(initReactI18next).init({
  fallbackLng: 'en',
  debug: false,
  resources: {
    en,
    de,
    fr
  }
})

// TODO: how to handle other date amd time formats
registerLocale('de', dateFnsDe)
setDefaultLocale('de')

export default i18n
