import { EmotionCache } from '@emotion/cache';
import { CssBaseline } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v13-pagesRouter';
import { withErrorSnackbar } from '@wepublish/errors/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  authLink,
  withJwtHandler,
  withSessionProvider,
} from '@wepublish/utils/website';
import { WebsiteProvider } from '@wepublish/website';
import {
  SessionWithTokenWithoutUser,
  createWithV1ApiClient,
} from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { AppProps } from 'next/app';
import getConfig from 'next/config';
import Head from 'next/head';
import Script from 'next/script';

import { initWePublishTranslator } from '@wepublish/utils/website';
import { setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { theme } from '@wepublish/ui';

setDefaultOptions({
  locale: de,
});
initWePublishTranslator();

type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}> & { emotionCache?: EmotionCache };

function CustomApp({ Component, pageProps, emotionCache }: CustomAppProps) {
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  return (
    <AppCacheProvider emotionCache={cache}>
      <WebsiteProvider theme={theme}>
        <WebsiteBuilderProvider
          Head={Head}
          Script={Script}
        >
          <CssBaseline />

          <Component {...pageProps} />
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </AppCacheProvider>
  );
}

const { publicRuntimeConfig } = getConfig();
const withApollo = createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [
  authLink,
]);
const ConnectedApp = withApollo(
  withErrorSnackbar(
    withPaywallBypassToken(withSessionProvider(withJwtHandler(CustomApp)))
  )
);

export { ConnectedApp as default };
