import {MockedProvider} from '@apollo/client/testing'
import {ComponentType, PropsWithChildren, memo, useCallback, useState} from 'react'
import {
  ApiV1,
  SessionTokenContext,
  WebsiteBuilderProvider,
  WebsiteProvider
} from '@wepublish/website'
import {css} from '@mui/material'
import {Global} from '@emotion/react'
import Head from 'next/head'
import Script from 'next/script'
import {Preview} from '@storybook/react'

export const parameters = {
  apolloClient: {
    MockedProvider,
    addTypename: false
  },
  options: {
    storySort: {
      includeName: true,
      method: 'alphabetical',
      order: [
        'Getting Started',
        'Overview',
        'Installation',
        'Usage',
        'Learn',
        'FAQ',
        'Glossary',
        '*',
        'Item'
      ]
    }
  }
} as Preview['parameters']

const SessionProvider = memo<PropsWithChildren>(({children}) => {
  const [token, setToken] = useState<ApiV1.UserSession | null>()
  const [user, setUser] = useState<ApiV1.User | null>(null)

  const setTokenAndGetMe = useCallback((newToken: ApiV1.UserSession | null) => {
    setToken(newToken)

    if (newToken) {
    } else {
      setUser(null)
    }
  }, [])

  return (
    <SessionTokenContext.Provider value={[user, !!token, setTokenAndGetMe]}>
      {children}
    </SessionTokenContext.Provider>
  )
})

const withWebsiteProvider = (Story: ComponentType) => (
  <WebsiteProvider>
    <WebsiteBuilderProvider Head={Head} Script={Script}>
      <SessionProvider>
        <Story />
      </SessionProvider>
    </WebsiteBuilderProvider>
  </WebsiteProvider>
)

const extraClassname = css`
  .extra-classname {
    background-color: pink;
  }
`

const withExtraClassname = (Story: ComponentType) => {
  return (
    <>
      <Global styles={extraClassname} />

      <Story />
    </>
  )
}

export const decorators = [withWebsiteProvider, withExtraClassname] as Preview['decorators']
