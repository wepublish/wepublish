import {UserSession} from '@wepublish/website/api'
import {ComponentType, memo} from 'react'
import {SessionProvider} from './session.provider'

export const withSessionProvider = <P extends {pageProps: {sessionToken?: UserSession}}>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => (
    <SessionProvider sessionToken={props.pageProps.sessionToken ?? null}>
      <ControlledComponent {...(props as P)} />
    </SessionProvider>
  ))
