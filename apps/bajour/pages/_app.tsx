import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { CssBaseline, ThemeProvider } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  FooterPaperWrapper,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  authLink,
  getWebsiteShell,
  initWePublishTranslator,
  NextWepublishLink,
  RoutedAdminBar,
  ThirdPartyScripts,
  WebsiteShellProps,
  withBuilderRouter,
  withJwtHandler,
  withSessionProvider,
} from '@wepublish/utils/website';
import { WebsiteProvider } from '@wepublish/website';
import { previewLink } from '@wepublish/website/admin';
import {
  FullSessionWithTokenWithoutUserFragment,
  WebsiteSettingsFragment,
  createWithApiClient,
} from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { format, setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import PlausibleProvider from 'next-plausible';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { BajourArticleDateWithShare } from '../src/bajour-article-date-with-share';
import { BajourTitleBlock } from '../src/components/bajour-title-block';
import { MainGrid } from '../src/components/layout/main-grid';
import { BajourBanner } from '../src/components/website-builder-overwrites/banner/bajour-banner';
import { BajourBlockRenderer } from '../src/components/website-builder-overwrites/block-renderer/block-renderer';
import { BajourTeaser } from '../src/components/website-builder-overwrites/blocks/teaser';
import { BajourTeaserSlider } from '../src/components/website-builder-overwrites/blocks/teaser-slider/bajour-teaser-slider';
import { BajourBreakBlock } from '../src/components/website-builder-overwrites/break/bajour-break';
import { BajourContextBox } from '../src/components/website-builder-overwrites/context-box/context-box';
import { BajourQuoteBlock } from '../src/components/website-builder-overwrites/quote/bajour-quote';
import {
  BajourTeaserGrid,
  BajourTeaserList,
} from '../src/components/website-builder-styled/blocks/teaser-grid-styled';
import theme, { navbarTheme } from '../src/styles/theme';

setDefaultOptions({
  locale: de,
});

initWePublishTranslator();
z.setErrorMap(zodI18nMap);

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
  : format(date, 'dd. MMMM yyyy');

export type CustomAppProps = AppProps<
  {
    sessionToken?: FullSessionWithTokenWithoutUserFragment;
  } & WebsiteShellProps
> & {
  emotionCache?: EmotionCache;
  websiteSettings?: WebsiteSettingsFragment;
  publicEnv?: {
    apiUrl: string;
    mailchimpPopupScriptUrl: string;
    stripeKey: string;
  };
};

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 12;
`;

const Footer = styled(FooterContainer)`
  grid-column: -1/1;

  ${FooterPaperWrapper} {
    color: ${({ theme }) => theme.palette.common.white};
  }
`;

function CustomApp({
  Component,
  pageProps,
  emotionCache,
  websiteSettings,
  publicEnv,
}: CustomAppProps) {
  const siteTitle = 'Bajour';
  const router = useRouter();
  const { popup } = router.query;

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  const settings =
    websiteSettings ??
    (typeof window !== 'undefined' ? window.WEBSITE_SETTINGS : undefined);

  const env =
    publicEnv ??
    (typeof window !== 'undefined' ?
      (window.PUBLIC_ENV as typeof publicEnv)
    : undefined);

  const shell = getWebsiteShell(pageProps);

  return (
    <PlausibleProvider
      enabled={
        settings?.analytics.plausible.enabled &&
        !!settings?.analytics.plausible.key
      }
      src={`https://plausible.io/js/${settings?.analytics.plausible.key}.js`}
    >
      <AppCacheProvider emotionCache={cache}>
        <Head>
          <title key="title">{siteTitle}</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
        </Head>

        <ThemeProvider theme={theme}>
          <WebsiteProvider>
            <WebsiteBuilderProvider
              meta={{ siteTitle }}
              Head={Head}
              Script={Script}
              elements={{ Link: NextWepublishLink }}
              date={{ format: dateFormatter }}
              blocks={{
                Renderer: BajourBlockRenderer,
                BaseTeaser: BajourTeaser,
                TeaserGrid: BajourTeaserGrid,
                TeaserList: BajourTeaserList,
                Break: BajourBreakBlock,
                Quote: BajourQuoteBlock,
                Title: BajourTitleBlock,
              }}
              blockStyles={{
                ContextBox: BajourContextBox,
                TeaserSlider: BajourTeaserSlider,
              }}
              thirdParty={{
                stripe: env?.stripeKey,
              }}
              ArticleDate={BajourArticleDateWithShare}
              Banner={BajourBanner}
            >
              <CssBaseline />

              <MainGrid>
                <ThemeProvider theme={navbarTheme}>
                  {shell.showNavigation && (
                    <NavBar
                      slug="main"
                      categorySlugs={[
                        ['basel-briefing', 'other'],
                        ['about-us'],
                      ]}
                      headerSlug="header"
                      iconSlug="icons"
                    />
                  )}
                </ThemeProvider>

                <Component {...pageProps} />

                {shell.showFooter && (
                  <Footer
                    slug="main"
                    categorySlugs={[['basel-briefing', 'other'], ['about-us']]}
                  />
                )}
              </MainGrid>

              <RoutedAdminBar />

              <ThirdPartyScripts settings={settings} />

              {popup && (
                <Script
                  src={env?.mailchimpPopupScriptUrl}
                  strategy="afterInteractive"
                />
              )}
            </WebsiteBuilderProvider>
          </WebsiteProvider>
        </ThemeProvider>
      </AppCacheProvider>
    </PlausibleProvider>
  );
}

const withApollo = createWithApiClient([authLink, previewLink]);
const ConnectedApp = withApollo(
  withBuilderRouter(
    withErrorSnackbar(
      withPaywallBypassToken(withSessionProvider(withJwtHandler(CustomApp)))
    )
  )
);

export { ConnectedApp as default };
