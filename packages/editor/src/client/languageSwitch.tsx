/* eslint-disable i18next/no-literal-string */

import React, {useState} from 'react'
import {Select, Spacing} from '@karma.run/ui'
import {cssRule, useStyle} from '@karma.run/react'
import {MaterialIconLanguage} from '@karma.run/icons'
//import {useTranslation} from 'react-i18next'

const languageSwitcher = cssRule({
  position: 'relative',
  padding: 20
})

export function LanguageSwitch() {
  const css = useStyle()
  const [uiLanguage, setUILanguage] = useState([])
  //const {t} = useTranslation()

  return (
    <div className={css(languageSwitcher)}>
      <Select
        icon={MaterialIconLanguage}
        options={[
          {id: 'en', lang: 'en_US', name: 'English'},
          {id: 'de', lang: 'de_CH', name: 'Deutsch'},
          {id: 'fr', lang: 'fr_FR', name: 'Français'}
        ]}
        value={{id: uiLanguage}}
        renderListItem={value => value?.name}
        marginBottom={Spacing.Small}
        onChange={value => {
          if (value?.name) {
            setUILanguage(value)
          }
        }}
      />
    </div>
  )
}
