import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import {registerLocale, setDefaultLocale} from 'react-datepicker'

import dateFnsDe from 'date-fns/locale/de'

import en from './locales/en.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import moment from 'moment'

i18n.init({
  interpolation: {
    format: function (value, format, lng) {
      if (value instanceof Date) return moment(value).format(format)
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

// TODO: how to handle other date amd time formats
registerLocale('de', dateFnsDe)
setDefaultLocale('de')

i18n.on('languageChanged', function (lng) {
  moment.locale(lng)
})

export default i18n
