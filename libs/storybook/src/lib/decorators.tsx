import {Global} from '@emotion/react'
import {CssBaseline, css} from '@mui/material'
import {Preview} from '@storybook/react'
import {
  ApiV1,
  SessionTokenContext,
  WebsiteBuilderProvider,
  WebsiteProvider
} from '@wepublish/website'
import {ComponentType, PropsWithChildren, memo, useCallback, useState} from 'react'

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

const Head = ({children}: PropsWithChildren) => <div data-testid="fake-head">{children}</div>
const Script = ({children, ...data}: PropsWithChildren<any>) => (
  <script data-testid="fake-script" {...data}>
    {children}
  </script>
)

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
