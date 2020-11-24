import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import fr from './locales/fr.json'
import de from './locales/de.json'

i18n.use(LanguageDetector).use(initReactI18next).init({
  fallbackLng: 'en',
  debug: false,
  resources: {
    en,
    fr,
    de
  }
})

export default i18n
