/* eslint-disable i18next/no-literal-string */

import React, {useEffect, useState} from 'react'
import {
  Select,
  Dialog,
  Panel,
  PanelSection,
  PanelHeader,
  NavigationButton,
  MenuButton
} from '@karma.run/ui'
import {cssRule, useStyle} from '@karma.run/react'
import {MaterialIconClose, MaterialIconLanguage} from '@karma.run/icons'
import {useTranslation} from 'react-i18next'

export function pxToRem(px: number): string {
  return `${px / 10}rem`
}

export function useStickyState(
  defaultValue: {id: string; lang: string; name: string},
  key: string
) {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key)
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue
  })
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue]
}

export function LanguageSelector() {
  const [uiLanguage, setUILanguage] = useStickyState(
    {id: 'en', lang: 'en_US', name: 'English'},
    'savedValues'
  )

  const [, i18n] = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const css = useStyle()
  const languageSelector = cssRule({
    marginBottom: pxToRem(62.5)
  })

  return (
    <div className={css(languageSelector)}>
      <Select
        options={[
          {id: 'en', lang: 'en_US', name: 'English'},
          {id: 'de', lang: 'de_CH', name: 'Deutsch'},
          {id: 'fr', lang: 'fr_FR', name: 'Français'}
        ]}
        value={{id: uiLanguage.id, lang: uiLanguage.lang, name: uiLanguage.name}}
        renderListItem={uiLanguage => uiLanguage.name}
        onChange={values => {
          if (values?.name) {
            setUILanguage(values)
            changeLanguage(values.id)
          }
        }}
      />
    </div>
  )
}

export function LanguageSwitch() {
  const currentLanguage = JSON.parse(localStorage.getItem('savedValues') || '{}')
  const [isLanguageSwitchDialogOpen, setIsLanguageSwitchDialogOpen] = useState(false)
  const {t} = useTranslation()

  return (
    <>
      <MenuButton
        icon={MaterialIconLanguage}
        label={currentLanguage.name}
        onClick={() => setIsLanguageSwitchDialogOpen(true)}
      />
      <Dialog
        open={isLanguageSwitchDialogOpen}
        onClose={() => setIsLanguageSwitchDialogOpen(false)}
        width={400}
        closeOnBackgroundClick>
        {() => (
          <Panel>
            <PanelHeader
              title={t('Select new language')}
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label={t('Close')}
                  onClick={() => setIsLanguageSwitchDialogOpen(false)}
                />
              }
            />
            <PanelSection>
              <LanguageSelector />
            </PanelSection>
          </Panel>
        )}
      </Dialog>
    </>
  )
}
