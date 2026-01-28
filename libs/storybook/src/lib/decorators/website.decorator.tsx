import NextScript from 'next/script';
import { CssBaseline } from '@mui/material';
import {
  ComponentType,
  PropsWithChildren,
  memo,
  useCallback,
  useState,
} from 'react';
import {
  SensitiveDataUser,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { SessionTokenContext } from '@wepublish/authentication/website';

import { WebsiteProvider } from '@wepublish/website';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';

const SessionProvider = memo<PropsWithChildren>(({ children }) => {
  const [token, setToken] = useState<SessionWithTokenWithoutUser | null>();
  const [user, setUser] = useState<SensitiveDataUser | null>(null);

  const setTokenAndGetMe = useCallback(
    async (newToken: SessionWithTokenWithoutUser | null) => {
      setToken(newToken);

      if (newToken) {
        setUser({
          id: '1234-1234',
          firstName: 'Foo',
          name: 'Bar',
          email: 'foobar@example.com',
          paymentProviderCustomers: [],
          properties: [],
          permissions: [],
        });
      } else {
        setUser(null);
      }
    },
    []
  );

  return (
    <SessionTokenContext.Provider value={[user, !!token, setTokenAndGetMe]}>
      {children}
    </SessionTokenContext.Provider>
  );
});

const Head = ({ children }: PropsWithChildren) => (
  <div data-testid="fake-head">{children}</div>
);

const Script = ({ children, ...data }: PropsWithChildren<any>) => (
  <>
    {/* we use next/script, but also include <script /> tag for snapshots */}
    <NextScript {...data}>{children}</NextScript>
    <script
      data-testid="fake-script"
      {...data}
    >
      {children}
    </script>
  </>
);

export const WithWebsiteProviderDecorator = (Story: ComponentType) => (
  <WebsiteProvider>
    <WebsiteBuilderProvider
      Head={Head}
      Script={Script}
    >
      <SessionProvider>
        <CssBaseline />
        <Story />
      </SessionProvider>
    </WebsiteBuilderProvider>
  </WebsiteProvider>
);
