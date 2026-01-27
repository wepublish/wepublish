import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { Container, css, CssBaseline, ThemeProvider } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { withErrorSnackbar } from '@wepublish/errors/website';
import { PaymentAmountPicker } from '@wepublish/membership/website';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  authLink,
  initWePublishTranslator,
  RoutedAdminBar,
  withBuilderRouter,
  withJwtHandler,
  withSessionProvider,
} from '@wepublish/utils/website';
import { WebsiteProvider } from '@wepublish/website';
import { previewLink } from '@wepublish/website/admin';
import { SessionWithTokenWithoutUser } from '@wepublish/website/api';
import { createWithV1ApiClient } from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { format, setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppProps } from 'next/app';
import getConfig from 'next/config';
import Head from 'next/head';
import Script from 'next/script';
import { ComponentType } from 'react';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import deOverriden from '../locales/deOverriden.json';
import { TsriFlexBlock } from '../src/components/block-layouts/tsri-base-flex-block';
import { TsriBreakBlock } from '../src/components/break-blocks/tsri-base-break-block';
import { TsriContextBox } from '../src/components/break-blocks/tsri-context-box';
import { TsriBaseTeaserSlots } from '../src/components/teaser-layouts/tsri-base-teaser-slots';
import { TsriBaseTeaser } from '../src/components/teasers/tsri-base-teaser';
import { TsriArticle } from '../src/components/tsri-article';
import { TsriArticleAuthor } from '../src/components/tsri-article-author';
import { TsriArticleAuthors } from '../src/components/tsri-article-authors';
import { TsriArticleDate } from '../src/components/tsri-article-date';
import { TsriArticleList } from '../src/components/tsri-article-list';
import { TsriArticleMeta } from '../src/components/tsri-article-meta';
import { TsriAuthor } from '../src/components/tsri-author';
import { TsriAuthorChip } from '../src/components/tsri-author-chip';
import { TsriAuthorLinks } from '../src/components/tsri-author-links';
import { TsriAuthorList } from '../src/components/tsri-author-list';
import { TsriBanner } from '../src/components/tsri-banner';
import { TsriBildwurfAdBlock } from '../src/components/tsri-bildwurf-ad-block';
import { TsriBlockRenderer } from '../src/components/tsri-block-renderer';
import { TsriBlocks } from '../src/components/tsri-block-renderer';
import { TsriCommentList } from '../src/components/tsri-comment-list';
import { TsriFooter } from '../src/components/tsri-footer';
import { TsriGlobalStyles } from '../src/components/tsri-global-styles';
import { TsriNextWepublishLink } from '../src/components/tsri-next-wepublish-link';
import { TsriQuoteBlock } from '../src/components/tsri-quote-block';
import { TsriRichText } from '../src/components/tsri-richtext';
import { TsriTag } from '../src/components/tsri-tag';
import { TsriTextToIcon } from '../src/components/tsri-text-to-icon';
import { TsriTitleBlock } from '../src/components/tsri-title-block';
import { TsriV2Navbar } from '../src/components/tsri-v2-navbar';
import theme from '../src/theme';

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
  position: relative;
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};
  container: main / inline-size;

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(10)};
    }
  `}
`;

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy')} | ${format(date, 'HH:mm')}`
  : format(date, 'dd. MMMM yyyy');

type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}> & { emotionCache?: EmotionCache };

function CustomApp({ Component, pageProps, emotionCache }: CustomAppProps) {
  const siteTitle = 'Tsri';

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  return (
    <AppCacheProvider emotionCache={cache}>
      <WebsiteProvider>
        <WebsiteBuilderProvider
          Head={Head}
          Footer={TsriFooter}
          Script={Script}
          Navbar={TsriV2Navbar}
          Article={TsriArticle}
          AuthorChip={TsriAuthorChip}
          ArticleDate={TsriArticleDate}
          ArticleMeta={TsriArticleMeta}
          ArticleList={TsriArticleList}
          PaymentAmount={PaymentAmountPicker}
          ArticleAuthor={TsriArticleAuthor}
          ArticleAuthors={TsriArticleAuthors}
          Author={TsriAuthor}
          AuthorLinks={TsriAuthorLinks}
          AuthorList={TsriAuthorList}
          TextToIcon={TsriTextToIcon}
          Tag={TsriTag}
          CommentList={TsriCommentList}
          elements={{ Link: TsriNextWepublishLink }}
          blocks={{
            BaseTeaser: TsriBaseTeaser,
            TeaserSlots: TsriBaseTeaserSlots,
            Break: TsriBreakBlock,
            Quote: TsriQuoteBlock,
            RichText: TsriRichText,
            Title: TsriTitleBlock,
            Renderer:
              TsriBlockRenderer as ComponentType<BuilderBlockRendererProps>,
            Blocks: TsriBlocks,
            FlexBlock: TsriFlexBlock,
            BildwurfAd: TsriBildwurfAdBlock,
          }}
          blockStyles={{
            ContextBox: TsriContextBox,
          }}
          date={{ format: dateFormatter }}
          meta={{ siteTitle }}
          thirdParty={{
            stripe: publicRuntimeConfig.env.STRIPE_PUBLIC_KEY,
          }}
          Banner={TsriBanner}
        >
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <TsriGlobalStyles />

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
              <NavbarContainer
                categorySlugs={[['about-us', 'categories', 'main']]}
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
                categorySlugs={[['about-us', 'categories', 'main']]}
                iconSlug="icons"
              />
            </Spacer>

            <RoutedAdminBar />

            {publicRuntimeConfig.env.GA_ID && (
              <GoogleAnalytics gaId={publicRuntimeConfig.env.GA_ID} />
            )}

            {publicRuntimeConfig.env.GTM_ID && (
              <GoogleTagManager gtmId={publicRuntimeConfig.env.GTM_ID} />
            )}

            {publicRuntimeConfig.env.SPARKLOOP_ID && (
              <Script
                src={`https://script.sparkloop.app/team_${publicRuntimeConfig.env.SPARKLOOP_ID}.js`}
                strategy="lazyOnload"
                data-sparkloop
              />
            )}
          </ThemeProvider>
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </AppCacheProvider>
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
