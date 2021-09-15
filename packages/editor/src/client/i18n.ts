import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import moment from 'moment'

import {format as formatDate, isDate} from 'date-fns'

import {nl} from 'date-fns/locale' // import all locales we need

const locales = {en, nl} // used to look up the required locale

// i18n.init({
interpolation: {
  format: (value, format, lng) => {
    if (isDate(value)) {
      const locale = locales[lng]
      return formatDate(value, format, {locale})
    }
  }
}
// })
// i18n.init({
//   interpolation: {
//     format: function (value, format, lng) {
//       if (value instanceof Date) return moment(value).format(format)
//       return value
//     }
//   }
// })

i18n.use(LanguageDetector).use(initReactI18next).init({
  fallbackLng: 'en',
  debug: false,
  resources: {
    en,
    de,
    fr
  }
})

i18n.on('languageChanged', function (lng) {
  moment.locale(lng)
})

export default i18n
