import {de} from 'date-fns/locale'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import * as reactDatepicker from 'react-datepicker'
import {initReactI18next} from 'react-i18next'

import {initI18N} from '../../src/app/i18n'

describe('i18n', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  test('should init i18next', () => {
    const initSpy = jest.spyOn(i18n, 'init')

    initI18N()

    expect(initSpy).toHaveBeenCalledWith({
      interpolation: {
        format: expect.any(Function)
      }
    })
  })

  test('should init i18next plugins', () => {
    const initSpy = jest.spyOn(i18n, 'init').mockImplementation((): any => {
      // do nothing
    })
    const useSpy = jest.spyOn(i18n, 'use')

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

  test('should init react-datepicker', () => {
    jest.spyOn(i18n, 'use').mockReturnThis()
    jest.spyOn(i18n, 'init')

    const registerLocaleSpy = jest.spyOn(reactDatepicker, 'registerLocale')
    const setDefaultLocaleSpy = jest.spyOn(reactDatepicker, 'setDefaultLocale')

    initI18N()

    expect(registerLocaleSpy).toHaveBeenCalledWith('de', de)
    expect(setDefaultLocaleSpy).toHaveBeenCalledWith('de')
  })
})
