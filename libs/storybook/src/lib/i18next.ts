import i18next from 'i18next'
import translation from 'zod-i18n-map/locales/de/zod.json'
import LanguageDetector from 'i18next-browser-languagedetector'
import resourcesToBackend from 'i18next-resources-to-backend'
import deTranlations from '@wepublish/website/translations/de.json'
import {initReactI18next} from 'react-i18next'
import {zodI18nMap} from 'zod-i18n-map'
import {z} from 'zod'

const i18n = i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(resourcesToBackend(() => deTranlations))
  .init({
    debug: true,
    partialBundledLanguages: true,
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en'],
    resources: {
      en: {zod: translation}
    }
  })
z.setErrorMap(zodI18nMap)

export default i18n
