import styled from '@emotion/styled';
import { Container, css, CssBaseline, ThemeProvider } from '@mui/material';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  authLink,
  getApiUrl,
  initWePublishTranslator,
  initWebsiteToken,
  NextWepublishLink,
  RoutedAdminBar,
  withBuilderRouter,
  withJwtHandler,
  withSessionProvider,
} from '@wepublish/utils/website';
import { WebsiteProvider } from '@wepublish/website';
import { previewLink } from '@wepublish/website/admin';
import {
  createWithV1ApiClient,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { format, setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppProps } from 'next/app';
import getConfig from 'next/config';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import theme from '../src/theme';

setDefaultOptions({
  locale: de,
});

initWePublishTranslator();
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

type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}>;

function CustomApp({ Component, pageProps }: CustomAppProps) {
  const siteTitle = 'We.Publish';
  const { locale } = useRouter();

  return (
    <WebsiteProvider>
      <WebsiteBuilderProvider
        Head={Head}
        Script={Script}
        elements={{ Link: NextWepublishLink }}
        date={{ format: dateFormatter }}
        meta={{ siteTitle }}
      >
        <ThemeProvider theme={theme}>
          <CssBaseline />

          <Head>
            <title key="title">{siteTitle}</title>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />

            {/* Feeds */}
            <link
              rel="alternate"
              type="application/rss+xml"
              href="/api/rss-feed"
            />
            <link
              rel="alternate"
              type="application/atom+xml"
              href="/api/atom-feed"
            />
            <link
              rel="alternate"
              type="application/feed+json"
              href="/api/json-feed"
            />

            {/* Sitemap */}
            <link
              rel="sitemap"
              type="application/xml"
              title="Sitemap"
              href="/api/sitemap"
            />

            {/* Favicon definitions, generated with https://realfavicongenerator.net/ */}
            <link
              rel="apple-touch-icon"
              sizes="180x180"
              href="/apple-touch-icon.png"
            />
            <link
              rel="icon"
              type="image/png"
              sizes="32x32"
              href="/favicon-32x32.png"
            />
            <link
              rel="icon"
              type="image/png"
              sizes="16x16"
              href="/favicon-16x16.png"
            />
            <link
              rel="manifest"
              href="/site.webmanifest"
            />
            <link
              rel="mask-icon"
              href="/safari-pinned-tab.svg"
              color="#000000"
            />
            <meta
              name="msapplication-TileColor"
              content="#ffffff"
            />
            <meta
              name="theme-color"
              content="#ffffff"
            />
          </Head>

          <Spacer>
            <NavBar
              categorySlugs={[[`categories-${locale}`, `about-us-${locale}`]]}
              slug={`main-${locale}`}
              headerSlug={`header-${locale}`}
              iconSlug={`icons-${locale}`}
              profileBtn={null}
              subscribeBtn={null}
              loginBtn={null}
            />

            <main>
              <MainSpacer maxWidth="lg">
                <Component {...pageProps} />
              </MainSpacer>
            </main>

            <FooterContainer
              slug={`footer-${locale}`}
              categorySlugs={[[`categories-${locale}`, `about-us-${locale}`]]}
              iconSlug={`icons-${locale}`}
            />
          </Spacer>

          <RoutedAdminBar />
        </ThemeProvider>
      </WebsiteBuilderProvider>
    </WebsiteProvider>
  );
}

const { publicRuntimeConfig } = getConfig();
const withApollo = createWithV1ApiClient(getApiUrl(), [authLink, previewLink]);

const ConnectedApp = withApollo(
  withBuilderRouter(
    withErrorSnackbar(
      withPaywallBypassToken(withSessionProvider(withJwtHandler(CustomApp)))
    )
  )
);

export { ConnectedApp as default };
