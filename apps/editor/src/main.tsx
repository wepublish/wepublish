import './polyfills';

import { ApolloProvider } from '@apollo/client/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import * as Sentry from '@sentry/react';
import { getApiClientV2, getSettings } from '@wepublish/editor/api';
import {
  AuthProvider,
  FacebookProvider,
  FeaturesProvider,
  InstagramProvider,
  TwitterProvider,
} from '@wepublish/ui/editor';
import { Locale } from 'date-fns';
import { de, enGB, fr } from 'date-fns/locale';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { IconContext } from 'react-icons';

import { App } from './app/app';
import { EditorCommandPaletteProvider } from './app/commandPalette/editorCommandPalette';
import { initI18N } from './app/i18n';
import { createEditorTheme } from './app/theme';
import { ElementID } from './shared/elementID';

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
      }),
      Sentry.graphqlClientIntegration({ endpoints: [apiEndpoint] }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  Sentry.setTag('app_name', appName);
  Sentry.setTag('component', 'editor');
}

const DATE_LOCALES: Record<string, Locale> = { de, en: enGB, fr };

Object.entries(DATE_LOCALES).forEach(([language, locale]) =>
  registerLocale(language, locale)
);

const editorTheme = createEditorTheme();

function ThemedApp() {
  const { i18n } = useTranslation();

  setDefaultLocale(DATE_LOCALES[i18n.language] ? i18n.language : 'en');

  return (
    <ThemeProvider
      theme={editorTheme}
      defaultMode="system"
      noSsr
      disableTransitionOnChange
    >
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
        <FeaturesProvider>
          <EditorCommandPaletteProvider>
            <IconContext.Provider value={{ className: 'rs-icon' }}>
              <FacebookProvider sdkLanguage={'en_US'}>
                <InstagramProvider>
                  <TwitterProvider>
                    <ThemedApp />
                  </TwitterProvider>
                </InstagramProvider>
              </FacebookProvider>
            </IconContext.Provider>
          </EditorCommandPaletteProvider>
        </FeaturesProvider>
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
