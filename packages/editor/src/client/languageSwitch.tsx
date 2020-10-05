/* eslint-disable i18next/no-literal-string */

import React, {useState} from 'react'
import {useThemeStyle, cssRuleWithTheme, Select, Spacing, SelectOption} from '@karma.run/ui'
import {MaterialIconLanguage} from '@karma.run/icons'

const languageSwitcher = cssRuleWithTheme(() => ({
  position: 'absolute',
  bottom: '0',
  border: '1px solid black',
  width: '100%'
}))

export function LanguageSwitch() {
  const css = useThemeStyle()
  const [value, setValue] = useState(null)
  const values: SelectOption = ['English']

  return (
    <div className={css(languageSwitcher)}>
      <Select
        icon={MaterialIconLanguage}
        label="Icon"
        options={values}
        value={value}
        renderListItem={value => value?.name}
        marginBottom={Spacing.Small}
      />
    </div>
  )
}
