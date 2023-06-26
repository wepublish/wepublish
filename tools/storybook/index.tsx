import {MockedProvider} from '@apollo/client/testing'
import {Global} from '@emotion/react'
import {CssBaseline, css} from '@mui/material'
import {Preview} from '@storybook/react'
import {
  ApiV1,
  SessionTokenContext,
  WebsiteBuilderProvider,
  WebsiteProvider
} from '@wepublish/website'
import Head from 'next/head'
import Script from 'next/script'
import {ComponentType, PropsWithChildren, memo, useCallback, useState} from 'react'

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
      setUser({
        id: '1234-1234',
        firstName: 'Foo',
        name: 'Bar',
        email: 'foobar@example.com',
        oauth2Accounts: [],
        paymentProviderCustomers: [],
        properties: []
      })
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
        <CssBaseline />
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
