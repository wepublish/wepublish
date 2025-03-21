import {setDefaultOptions} from 'date-fns'
import {de} from 'date-fns/locale'
import i18next from 'i18next'
import translation from 'zod-i18n-map/locales/de/zod.json'
import LanguageDetector from 'i18next-browser-languagedetector'
import resourcesToBackend from 'i18next-resources-to-backend'
import deTranlations from '@wepublish/website/translations/de.json'
import {initReactI18next} from 'react-i18next'

setDefaultOptions({
  locale: de
})

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(resourcesToBackend(() => deTranlations))
  .init({
    partialBundledLanguages: true,
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en'],
    resources: {
      en: {zod: translation}
    }
  })

export default i18next
