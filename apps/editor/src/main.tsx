import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  InMemoryCache,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { CssBaseline, ThemeProvider } from '@mui/material';
import * as Sentry from '@sentry/react';
import { possibleTypes } from '@wepublish/editor/api';
import { getSettings, LocalStorageKey } from '@wepublish/editor/api-v2';
import { theme } from '@wepublish/ui';
import {
  AuthProvider,
  FacebookProvider,
  InstagramProvider,
  TwitterProvider,
} from '@wepublish/ui/editor';
import { createUploadLink } from 'apollo-upload-client';
import { createRoot } from 'react-dom/client';
import { IconContext } from 'react-icons';

import { App } from './app/app';
import { initI18N } from './app/i18n';
import { ElementID } from './shared/elementID';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const onDOMContentLoaded = async () => {
  const { apiURL } = getSettings();

  const adminAPIURL = `${apiURL}/v1/admin`;

  const authLink = new ApolloLink((operation, forward) => {
    const token = localStorage.getItem(LocalStorageKey.SessionToken);
    const context = operation.getContext();

    operation.setContext({
      headers: {
        authorization: token ? `Bearer ${token}` : '',
        preview: 'preview',
        ...context.headers,
      },
      credentials: 'include',
      ...context,
    });

    return forward(operation);
  });

  const authErrorLink = onError(
    ({ graphQLErrors, /* networkError, */ operation, forward }) => {
      if (graphQLErrors) {
        graphQLErrors.forEach(
          ({ /* message, locations, path, */ extensions }) => {
            if (
              ['UNAUTHENTICATED', 'TOKEN_EXPIRED'].includes(
                (extensions?.code as string | undefined) ?? ''
              ) &&
              !(
                window.location.pathname.includes('/logout') ||
                window.location.pathname.includes('/login')
              )
            ) {
              localStorage.removeItem(LocalStorageKey.SessionToken);
              // TODO: implement this handling console.warn()
            }
          }
        );
      }

      forward(operation);
    }
  );

  const mainLink = createUploadLink({ uri: adminAPIURL });

  const client = new ApolloClient({
    link: authLink.concat(authErrorLink).concat(mainLink),
    cache: new InMemoryCache({
      possibleTypes: possibleTypes.possibleTypes,
    }),
  });

  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => e.preventDefault());

  const container = document.getElementById(ElementID.ReactRoot);
  const root = createRoot(container!);

  root.render(
    <ApolloProvider client={client}>
      <AuthProvider>
        <IconContext.Provider value={{ className: 'rs-icon' }}>
          <FacebookProvider sdkLanguage={'en_US'}>
            <InstagramProvider>
              <TwitterProvider>
                <ThemeProvider theme={theme}>
                  <CssBaseline />
                  <App />
                </ThemeProvider>
              </TwitterProvider>
            </InstagramProvider>
          </FacebookProvider>
        </IconContext.Provider>
      </AuthProvider>
    </ApolloProvider>
  );
};

initI18N();

if (document.readyState !== 'loading') {
  onDOMContentLoaded().catch(console.error);
} else {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await onDOMContentLoaded();
    } catch (e) {
      console.log(e);
    }
  });
}
