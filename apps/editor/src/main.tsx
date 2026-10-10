import './polyfills';

import { ApolloProvider } from '@apollo/client/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import * as Sentry from '@sentry/react';
import { getApiClientV2, getSettings } from '@wepublish/editor/api';
import {
  AuthProvider,
  FacebookProvider,
  InstagramProvider,
  TwitterProvider,
} from '@wepublish/ui/editor';
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { IconContext } from 'react-icons';

import { App } from './app/app';
import {
  scrubBreadcrumb,
  scrubEvent,
  scrubRecordingEvent,
} from './app/sentryScrub';
import { captureSupportLoginResult } from './app/supportLogin';
import { ColorModeProvider, useColorMode } from './app/colorMode';
import { initI18N } from './app/i18n';
import { createEditorTheme } from './app/theme';
import { ElementID } from './shared/elementID';

captureSupportLoginResult();

const { sentryDSN, apiURL, appName, appEnvironment } = getSettings();

if (sentryDSN) {
  const apiEndpoint = `${apiURL}/v1`;

  Sentry.init({
    dsn: sentryDSN,
    environment: appEnvironment,
    release: process.env.APP_RELEASE_ID,
    tracePropagationTargets: [/^\//, apiEndpoint],
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
        maskAllInputs: true,
        beforeAddRecordingEvent: scrubRecordingEvent,
      }),
      Sentry.graphqlClientIntegration({ endpoints: [apiEndpoint] }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend: scrubEvent,
    beforeSendTransaction: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });

  Sentry.setTag('app_name', appName);
  Sentry.setTag('component', 'editor');
}

function ThemedApp() {
  const { mode } = useColorMode();
  const theme = useMemo(() => createEditorTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <App />
    </ThemeProvider>
  );
}

const onDOMContentLoaded = async () => {
  const client = getApiClientV2();

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
                <ColorModeProvider>
                  <ThemedApp />
                </ColorModeProvider>
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
