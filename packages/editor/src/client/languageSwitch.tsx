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

let AVAILABLE_LANG: {id: string; lang: string; name: string}[] = []

export function LanguageSelector() {
  AVAILABLE_LANG = [
    {id: 'en', lang: 'en_US', name: 'English'},
    {id: 'fr', lang: 'fr_FR', name: 'Français'},
    {id: 'de', lang: 'de_CH', name: 'Deutsch'}
  ]

  const [uiLanguage, setUILanguage] = useStickyState(AVAILABLE_LANG[0], 'localStorageValues')

  const {i18n} = useTranslation()

  const css = useStyle()
  const languageSelector = cssRule({
    marginBottom: pxToRem(62.5)
  })

  return (
    <div className={css(languageSelector)}>
      <Select
        options={AVAILABLE_LANG}
        value={AVAILABLE_LANG.find(lang => lang.id === uiLanguage.id)}
        renderListItem={uiLanguage => uiLanguage.name}
        onChange={values => {
          if (values?.name) {
            setUILanguage(values)
            i18n.changeLanguage(values.id)
          }
        }}
      />
    </div>
  )
}

export function LanguageSwitch() {
  const [isLanguageSwitchDialogOpen, setIsLanguageSwitchDialogOpen] = useState(false)
  const {t} = useTranslation()

  return (
    <>
      <MenuButton
        icon={MaterialIconLanguage}
        label={t('navbar.languageSwitch.currentLanguage')}
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
              title={t('navbar.languageSwitch.selectNewLanguage')}
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label={t('navbar.languageSwitch.close')}
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
