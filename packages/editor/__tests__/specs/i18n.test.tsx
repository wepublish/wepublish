import i18n from 'i18next'
import {initI18N} from '../../src/client/i18n'
import LanguageDetector from 'i18next-browser-languagedetector'
import {initReactI18next} from 'react-i18next'
import * as reactDatepicker from 'react-datepicker'
import {de} from 'date-fns/locale'

describe('i18n', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should init i18next', () => {
    const initSpy = jest.spyOn(i18n, 'init')

    initI18N()

    expect(initSpy).toHaveBeenCalledWith({
      interpolation: {
        format: expect.any(Function)
      }
    })
  })

  it('should init i18next plugins', () => {
    const useSpy = jest.spyOn(i18n, 'use')
    const initSpy = jest.spyOn(i18n, 'init')

    initI18N()

    expect(useSpy).toHaveBeenCalledWith(LanguageDetector)
    expect(useSpy).toHaveBeenCalledWith(initReactI18next)
    expect(initSpy).toHaveBeenCalledWith({
      fallbackLng: 'en',
      debug: false,
      resources: {
        en: expect.any(Object),
        de: expect.any(Object),
        fr: expect.any(Object)
      }
    })
  })

  it('should init react-datepicker', () => {
    jest.spyOn(i18n, 'use').mockReturnThis()
    jest.spyOn(i18n, 'init')

    const registerLocaleSpy = jest.spyOn(reactDatepicker, 'registerLocale')
    const setDefaultLocaleSpy = jest.spyOn(reactDatepicker, 'setDefaultLocale')

    initI18N()

    expect(registerLocaleSpy).toHaveBeenCalledWith('de', de)
    expect(setDefaultLocaleSpy).toHaveBeenCalledWith('de')
  })
})
