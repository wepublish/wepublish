import styled from '@emotion/styled';
import { Container, css, CssBaseline, ThemeProvider } from '@mui/material';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
  NavbarIconButtonWrapper,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  authLink,
  initWePublishTranslator,
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
import Script from 'next/script';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { CulturBreakBlock } from '../src/components/cultur-break';
import { CulturTeaser } from '../src/components/cultur-teaser';
import { Footer } from '../src/components/footer';
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

  ${NavbarIconButtonWrapper} {
    color: inherit;
  }
`;

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
  : format(date, 'dd. MMMM yyyy');

type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}>;

function CustomApp({ Component, pageProps }: CustomAppProps) {
  const siteTitle = 'Cültür';

  return (
    <WebsiteProvider>
      <WebsiteBuilderProvider
        Head={Head}
        Script={Script}
        Footer={Footer}
        elements={{ Link: NextWepublishLink }}
        blocks={{
          BaseTeaser: CulturTeaser,
          Break: CulturBreakBlock,
        }}
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
              rel="icon"
              type="image/png"
              href="/favicon-96x96.png"
              sizes="96x96"
            />
            <link
              rel="icon"
              type="image/svg+xml"
              href="/favicon.svg"
            />
            <link
              rel="shortcut icon"
              href="/favicon.ico"
            />
            <link
              rel="apple-touch-icon"
              sizes="180x180"
              href="/apple-touch-icon.png"
            />
            <meta
              name="apple-mobile-web-app-title"
              content="Cültür"
            />
            <link
              rel="manifest"
              href="/site.webmanifest"
            />
          </Head>

          <Spacer>
            <NavBar
              categorySlugs={[['categories']]}
              slug="main"
              headerSlug="header"
              iconSlug="icons"
              loginBtn={null}
              subscribeBtn={null}
            />

            <main>
              <MainSpacer maxWidth="lg">
                <Component {...pageProps} />
              </MainSpacer>
            </main>

            <FooterContainer
              slug="footer"
              categorySlugs={[['categories']]}
              iconSlug="icons"
            />
          </Spacer>

          <RoutedAdminBar />
        </ThemeProvider>
      </WebsiteBuilderProvider>
    </WebsiteProvider>
  );
}

const { publicRuntimeConfig } = getConfig();
const withApollo = createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [
  authLink,
  previewLink,
]);
const ConnectedApp = withApollo(
  withBuilderRouter(
    withErrorSnackbar(
      withPaywallBypassToken(withSessionProvider(withJwtHandler(CustomApp)))
    )
  )
);

export { ConnectedApp as default };
