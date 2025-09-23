import { SessionWithTokenWithoutUser } from '@wepublish/website/api';
import { ComponentType, memo } from 'react';
import { SessionProvider } from './session.provider';

export const withSessionProvider = <
  P extends { pageProps: { sessionToken?: SessionWithTokenWithoutUser } },
>(
  ControlledComponent: ComponentType<P>,
  Provider: typeof SessionProvider = SessionProvider
) =>
  memo<P>(props => (
    <Provider sessionToken={props.pageProps.sessionToken ?? null}>
      <ControlledComponent {...(props as P)} />
    </Provider>
  ));
