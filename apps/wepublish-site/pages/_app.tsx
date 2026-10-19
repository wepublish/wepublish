import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { Container, css, CssBaseline, ThemeProvider } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  authLink,
  getWebsiteShell,
  initWePublishTranslator,
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

import deOverriden from '../locales/deOverriden.json';
import { WepBreakBlock } from '../src/components/break-blocks/wep-break-block';
import { WepBaseTeaserSlots } from '../src/components/teaser-layouts/wep-base-teaser-slots';
import { WepBaseTeaser } from '../src/components/teasers/wep-base-teaser';
import { WepArticle } from '../src/components/wep-article';
import { WepBlockRenderer } from '../src/components/wep-block-renderer';
import { WepContentWrapper } from '../src/components/wep-content-wrapper';
import { WepFooter } from '../src/components/wep-footer';
import { WepGlobalStyles } from '../src/components/wep-global-styles';
import { WepNavbar } from '../src/components/wep-navbar';
import { WepPage } from '../src/components/wep-page';
import { WepQuoteBlock } from '../src/components/wep-quote-block';
import { localizeSlug } from '../src/localize-slug';
import theme from '../src/theme';
import { WepLink } from '../src/wep-link';

setDefaultOptions({
  locale: de,
});

initWePublishTranslator(deOverriden);
z.setErrorMap(zodI18nMap);

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  gap: ${({ theme }) => theme.spacing(3)};
  min-height: 100vh;
`;

const MainSpacer = styled(Container)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(10)};
    }
  `}
`;

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`;

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
  publicEnv?: { apiUrl: string };
};

function CustomApp({
  Component,
  pageProps,
  emotionCache,
  websiteSettings,
}: CustomAppProps) {
  const siteTitle = 'We.Publish';
  const router = useRouter();
  const { locale } = router;

  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  const settings =
    websiteSettings ??
    (typeof window !== 'undefined' ? window.WEBSITE_SETTINGS : undefined);

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
        <ThemeProvider theme={theme}>
          <WebsiteProvider>
            <WebsiteBuilderProvider
              Head={Head}
              Script={Script}
              Footer={WepFooter}
              Navbar={WepNavbar}
              ContentWrapper={WepContentWrapper}
              Article={WepArticle}
              Page={WepPage}
              blocks={{
                Renderer: WepBlockRenderer,
                BaseTeaser: WepBaseTeaser,
                TeaserSlots: WepBaseTeaserSlots,
                Quote: WepQuoteBlock,
                Break: WepBreakBlock,
              }}
              elements={{ Link: WepLink }}
              date={{ format: dateFormatter }}
              meta={{ siteTitle }}
            >
              <CssBaseline />
              <WepGlobalStyles isHomePage={router.asPath === '/'} />

              <Head>
                <title key="title">{siteTitle}</title>
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1.0"
                />
              </Head>

              <Spacer>
                {shell.showNavigation && (
                  <NavBar
                    categorySlugs={[[localizeSlug('main-header', locale)]]}
                    slug={localizeSlug('main', locale)}
                    headerSlug={localizeSlug('header', locale)}
                    iconSlug={localizeSlug('icons', locale)}
                    profileBtn={null}
                    subscribeBtn={null}
                    loginBtn={null}
                  />
                )}

                <main>
                  <MainSpacer maxWidth="lg">
                    <Component {...pageProps} />
                  </MainSpacer>
                </main>

                {shell.showFooter && (
                  <FooterContainer
                    slug={localizeSlug('footer', locale)}
                    categorySlugs={[
                      [
                        localizeSlug('main-footer', locale),
                        localizeSlug('categories', locale),
                        localizeSlug('ueber-uns', locale),
                        `sprachwahl`,
                      ],
                    ]}
                    iconSlug={localizeSlug('icons', locale)}
                  />
                )}
              </Spacer>

              <RoutedAdminBar />

              <ThirdPartyScripts settings={settings} />
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
