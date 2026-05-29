import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { CssBaseline, ThemeProvider } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { GoogleTagManager } from '@next/third-parties/google';
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
  RoutedAdminBar,
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
import PlausibleProvider from 'next-plausible';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import deOverridden from '../locales/deOverridden.json';
import { ReflektFlexBlock } from '../src/components/block-layouts/reflekt-base-flex-block';
import { ReflektBaseBreakBlock } from '../src/components/break-blocks/reflekt-base-break-block';
import { MainSpacer } from '../src/components/main-spacer';
import { ReflektArticle } from '../src/components/reflekt-article';
import { ReflektAuthorList } from '../src/components/reflekt-author-list';
import { ReflektAuthorListItem } from '../src/components/reflekt-author-list-item';
import { ReflektBanner } from '../src/components/reflekt-banner';
import {
  ReflektBlockRenderer,
  ReflektBlocks,
} from '../src/components/reflekt-block-renderer';
import { RefFooter } from '../src/components/reflekt-footer';
import { ReflektGlobalStyles } from '../src/components/reflekt-global-styles';
import { ReflektImageBlock } from '../src/components/reflekt-image-block';
import { ReflektLink } from '../src/components/reflekt-link';
import {
  ReflektListItem,
  ReflektUnorderedList,
} from '../src/components/reflekt-lists';
import { ReflektLoginForm } from '../src/components/reflekt-login-form';
import { ReflektMemberPlanPicker } from '../src/components/reflekt-memberplan-picker';
import { ReflektMemberPlanItem } from '../src/components/reflekt-memberplan-picker-item';
import { ReflektNavbar } from '../src/components/reflekt-navbar';
import { ReflektPage } from '../src/components/reflekt-page';
import { ReflektQuoteBlock } from '../src/components/reflekt-quote-block';
import { ReflektRegistrationForm } from '../src/components/reflekt-registration-form';
import { ReflektRenderElement } from '../src/components/reflekt-render-element';
import { ReflektRenderRichtext } from '../src/components/reflekt-render-richtext';
import { ReflektRichTextBlock } from '../src/components/reflekt-richtext-block';
import {
  ReflektSubscribe,
  ReflektSubscribeForm,
} from '../src/components/reflekt-subscribe';
import { ReflektTag } from '../src/components/reflekt-tag';
import { ReflektTitleBlock } from '../src/components/reflekt-title-block';
import { ReflektUserForm } from '../src/components/reflekt-user-form';
import { ReflektArticleList } from '../src/components/teaser-layouts/reflekt-article-list';
import { ReflektBaseGridFlex } from '../src/components/teaser-layouts/reflekt-base-grid-flex';
import { ReflektBaseTeaserSlots } from '../src/components/teaser-layouts/reflekt-base-teaser-slots';
import { ReflektBaseTeaser } from '../src/components/teasers/reflekt-base-teaser';
import theme from '../src/theme';

setDefaultOptions({
  locale: de,
});

initWePublishTranslator(deOverridden);
z.setErrorMap(zodI18nMap);

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr;
  gap: ${({ theme }) => theme.spacing(3)};
  min-height: 100vh;
  overflow-x: hidden;
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
}> & { emotionCache?: EmotionCache };

function CustomApp({ Component, pageProps, emotionCache }: CustomAppProps) {
  const siteTitle = 'Reflekt';

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  return (
    <PlausibleProvider
      enabled={!!publicRuntimeConfig.env.PA_ID}
      src={`https://plausible.io/js/${publicRuntimeConfig.env.PA_ID}.js`}
    >
      <AppCacheProvider emotionCache={cache}>
        <WebsiteProvider>
          <WebsiteBuilderProvider
            Head={Head}
            Script={Script}
            Page={ReflektPage}
            Footer={RefFooter}
            Navbar={ReflektNavbar}
            ArticleList={ReflektArticleList}
            Article={ReflektArticle}
            Tag={ReflektTag}
            AuthorList={ReflektAuthorList}
            AuthorListItem={ReflektAuthorListItem}
            Banner={ReflektBanner}
            Subscribe={ReflektSubscribeForm}
            MemberPlanPicker={ReflektMemberPlanPicker}
            MemberPlanItem={ReflektMemberPlanItem}
            UserForm={ReflektUserForm}
            LoginForm={ReflektLoginForm}
            RegistrationForm={ReflektRegistrationForm}
            elements={{
              Link: ReflektLink,
              UnorderedList: ReflektUnorderedList,
              ListItem: ReflektListItem,
            }}
            date={{ format: dateFormatter }}
            meta={{ siteTitle }}
            richtext={{
              RenderElement: ReflektRenderElement,
              RenderRichtext: ReflektRenderRichtext,
            }}
            blocks={{
              TeaserSlots: ReflektBaseTeaserSlots,
              TeaserGridFlex: ReflektBaseGridFlex,
              BaseTeaser: ReflektBaseTeaser,
              Break: ReflektBaseBreakBlock,
              FlexBlock: ReflektFlexBlock,
              Quote: ReflektQuoteBlock,
              Title: ReflektTitleBlock,
              RichText: ReflektRichTextBlock,
              Renderer: ReflektBlockRenderer,
              Blocks: ReflektBlocks,
              Subscribe: ReflektSubscribe,
              Image: ReflektImageBlock,
            }}
          >
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <ReflektGlobalStyles />

              <Head>
                <title key="title">{siteTitle}</title>
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1.0"
                />
                <meta
                  name="format-detection"
                  content="telephone=no"
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
                  href="/favicon-96x96.png?v=20260529"
                  sizes="96x96"
                />
                <link
                  rel="icon"
                  type="image/svg+xml"
                  href="/favicon.svg?v=20260529"
                />
                <link
                  rel="shortcut icon"
                  href="/favicon.ico?v=20260529"
                />
                <link
                  rel="apple-touch-icon"
                  sizes="180x180"
                  href="/apple-touch-icon.png?v=20260529"
                />
                <meta
                  name="apple-mobile-web-app-title"
                  content="REFLEKT"
                />
                <link
                  rel="manifest"
                  href="/site.webmanifest?v=20260529"
                />
                <link
                  rel="mask-icon"
                  href="/safari-pinned-tab.svg?v=20260529"
                  color="#000000"
                />
                <meta
                  name="theme-color"
                  content="#ffffff"
                />
              </Head>

              <Spacer>
                <NavBar
                  categorySlugs={[['main']]}
                  slug="main"
                  headerSlug="header"
                  iconSlug="icons"
                />

                <main>
                  <MainSpacer maxWidth="lg">
                    <Component {...pageProps} />
                  </MainSpacer>
                </main>

                <FooterContainer
                  slug="footer"
                  categorySlugs={[['main']]}
                  iconSlug="icons"
                />
              </Spacer>

              <RoutedAdminBar />

              {publicRuntimeConfig.env.GTM_ID && (
                <GoogleTagManager gtmId={publicRuntimeConfig.env.GTM_ID} />
              )}
            </ThemeProvider>
          </WebsiteBuilderProvider>
        </WebsiteProvider>
      </AppCacheProvider>
    </PlausibleProvider>
  );
}

const { publicRuntimeConfig } = getConfig();
const withApollo = createWithV1ApiClient(getApiUrl(), [authLink, previewLink]);
const ConnectedApp = withApollo(
  withErrorSnackbar(
    withPaywallBypassToken(withSessionProvider(withJwtHandler(CustomApp)))
  )
);

export { ConnectedApp as default };
