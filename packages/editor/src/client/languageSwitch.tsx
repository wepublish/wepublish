/* eslint-disable i18next/no-literal-string */

import React, {useContext, useEffect, useState} from 'react'
import {Select, NavigationContext, NavigationBar} from '@karma.run/ui'
import {cssRule, useStyle} from '@karma.run/react'
import {MaterialIconLanguage} from '@karma.run/icons'
import {useStickyState} from './utility'
import i18n from './i18n'

export function pxToRem(px: number): string {
  return `${px / 10}rem`
}

export function LanguageSwitch() {
  const css = useStyle()
  const [uiLanguage, setUILanguage] = useStickyState(
    {id: 'en', lang: 'en_US', name: 'English'},
    'savedValues'
  )
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const context = useContext(NavigationContext)
  const isCollapsed = context.isCollapsed

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('This will run after 1 second!')
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const languageSwitch = cssRule({
    marginBottom: pxToRem(100),
    paddingTop: pxToRem(7.5),
    paddingLeft: pxToRem(11),
    paddingBottom: pxToRem(7.5),

    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.025)'
    },

    '& > div ': {padding: 0},

    '& > div > ul': {
      borderRadius: 0,
      marginTop: pxToRem(10),
      marginLeft: pxToRem(-11),
      width: 'calc(100% + 1.1rem)',

      '& li': {
        paddingLeft: pxToRem(13)
      }
    },

    '& > div > label > button': {
      paddingLeft: pxToRem(21),
      border: 'none',
      transition: isCollapsed ? 'opacity 200ms ease-in' : 'opacity 200ms ease-in',
      opacity: isCollapsed ? 0 : 1
    },

    '& > div > label > svg': {
      fontSize: '1.5em',
      cursor: 'pointer',

      '&:nth-child(3)': {
        fontSize: isCollapsed ? '1em' : '1.5em'
      }
    },

    '& > div > label': {height: 24}
  })

  function toilet() {
    const timer = setTimeout(() => {
      return uiLanguage.id
    }, 1000)
    return () => clearTimeout(timer)
  }

  return (
    <div className={css(languageSwitch)}>
      <Select
        icon={MaterialIconLanguage}
        options={[
          {id: 'en', lang: 'en_US', name: 'English'},
          {id: 'de', lang: 'de_CH', name: 'Deutsch'},
          {id: 'fr', lang: 'fr_FR', name: 'Français'}
        ]}
        value={{id: uiLanguage.id, lang: uiLanguage.lang, name: uiLanguage.name}}
        renderListItem={uiLanguage => (isCollapsed ? toilet() : uiLanguage.name)}
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
