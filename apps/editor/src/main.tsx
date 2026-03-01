import '@wepublish/utils/sentry/editor';

import { ApolloProvider } from '@apollo/client';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { getApiClientV2 } from '@wepublish/editor/api';
import { theme as WePTheme } from '@wepublish/ui';
import {
  AuthProvider,
  FacebookProvider,
  InstagramProvider,
  TwitterProvider,
} from '@wepublish/ui/editor';
import { createRoot } from 'react-dom/client';
import { IconContext } from 'react-icons';

import { App } from './app/app';
import { initI18N } from './app/i18n';
import { ElementID } from './shared/elementID';

// Just so we have the typings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NOOP = () => {
  // The WeP theme right now does not fit the editor as it's red
  // while the rest of the editor is blue
  console.log(WePTheme);
};

const theme = createTheme();

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
