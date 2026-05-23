import { EmotionCache } from '@emotion/cache';
import styled from '@emotion/styled';
import { Container, CssBaseline, ThemeProvider } from '@mui/material';
import {
  AppCacheProvider,
  createEmotionCache,
} from '@mui/material-nextjs/v15-pagesRouter';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  AsyncSessionProvider,
  authLink,
  getApiUrl,
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
  createWithApiClient,
  SessionWithTokenWithoutUser,
  WebsiteSettingsFragment,
} from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { format, setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import deOverriden from '../locales/deOverriden.json';
import { FontSizeProvider } from '../src/components/font-size-picker';
import {
  HauptstadtArticle,
  HauptstadtArticleAuthors,
  HauptstadtArticleMeta,
} from '../src/components/hauptstadt-article';
import { HauptstadtArticleDate } from '../src/components/hauptstadt-article-date';
import { HauptstadtAuthorChip } from '../src/components/hauptstadt-author-chip';
import { HauptstadtBanner } from '../src/components/hauptstadt-banner';
import { HauptstadtBlockRenderer } from '../src/components/hauptstadt-block-renderer';
import { HauptstadtBreakBlock } from '../src/components/hauptstadt-break';
import { HauptstadtCommentList } from '../src/components/hauptstadt-comment';
import { HauptstadtContentWrapper } from '../src/components/hauptstadt-content-wrapper';
import { HauptstadtEvent } from '../src/components/hauptstadt-event';
import {
  HauptstadtImageBlock,
  HauptstadtImageGalleryBlock,
} from '../src/components/hauptstadt-image-block';
import { HauptstadtListicle } from '../src/components/hauptstadt-listicle';
import {
  HauptstadtMemberPlanItem,
  HauptstadtMemberPlanPicker,
} from '../src/components/hauptstadt-memberplan-picker';
import { HauptstadtNavbar } from '../src/components/hauptstadt-navbar';
import { HauptstadtFooter } from '../src/components/hauptstadt-navigation';
import { HauptstadtPage } from '../src/components/hauptstadt-page';
import { HauptstadtPaymentMethodPicker } from '../src/components/hauptstadt-payment-method-picker';
import { HauptstadtPaywall } from '../src/components/hauptstadt-paywall';
import { HauptstadtQuoteBlock } from '../src/components/hauptstadt-quote';
import { HauptstadtSubscribe } from '../src/components/hauptstadt-subscribe';
import { HauptstadtSubscriptionListItem } from '../src/components/hauptstadt-subscription-list-item';
import {
  HauptstadtAlternatingTeaser,
  HauptstadtFocusTeaser,
  HauptstadtTeaser,
  HauptstadtTeaserGrid,
  HauptstadtTeaserList,
  HauptstadtTeaserSlider,
  HauptstadtTeaserSlots,
} from '../src/components/hauptstadt-teaser';
import { HauptstadtTitleBlock } from '../src/components/hauptstadt-title-block';
import { PrintLogo } from '../src/components/print-logo';
import { withTrackFirstRoute } from '../src/hooks/use-is-first-route';
import { printStyles } from '../src/print-styles';
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
  min-height: 100vh;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    gap: ${({ theme }) => theme.spacing(3)};
  }
`;

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`;

const Main = styled('main')`
  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-top: 11px;
  }
`;

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy')} um ${format(date, 'HH:mm')}`
  : format(date, 'dd. MMMM yyyy');

export type CustomAppProps = AppProps<{
  sessionToken?: SessionWithTokenWithoutUser;
}> & { emotionCache?: EmotionCache; websiteSettings?: WebsiteSettingsFragment };

function CustomApp({
  Component,
  pageProps,
  emotionCache,
  websiteSettings,
}: CustomAppProps) {
  const siteTitle = 'Hauptstadt';

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
  const cache = emotionCache ?? createEmotionCache();
  cache.compat = true;

  const settings =
    websiteSettings ??
    (typeof window !== 'undefined' ? window.WEBSITE_SETTINGS : undefined);

  return (
    <AppCacheProvider emotionCache={cache}>
      <WebsiteProvider>
        <WebsiteBuilderProvider
          Head={Head}
          Script={Script}
          elements={{ Link: NextWepublishLink }}
          Footer={HauptstadtFooter}
          Navbar={HauptstadtNavbar}
          ContentWrapper={HauptstadtContentWrapper}
          AuthorChip={HauptstadtAuthorChip}
          Page={HauptstadtPage}
          Article={HauptstadtArticle}
          ArticleAuthors={HauptstadtArticleAuthors}
          ArticleMeta={HauptstadtArticleMeta}
          ArticleDate={HauptstadtArticleDate}
          Event={HauptstadtEvent}
          Banner={HauptstadtBanner}
          Paywall={HauptstadtPaywall}
          MemberPlanPicker={HauptstadtMemberPlanPicker}
          MemberPlanItem={HauptstadtMemberPlanItem}
          CommentList={HauptstadtCommentList}
          SubscriptionListItem={HauptstadtSubscriptionListItem}
          PaymentMethodPicker={HauptstadtPaymentMethodPicker}
          blocks={{
            Renderer: HauptstadtBlockRenderer,
            Title: HauptstadtTitleBlock,
            Quote: HauptstadtQuoteBlock,
            BaseTeaser: HauptstadtTeaser,
            TeaserList: HauptstadtTeaserList,
            TeaserGrid: HauptstadtTeaserGrid,
            TeaserSlots: HauptstadtTeaserSlots,
            Image: HauptstadtImageBlock,
            ImageGallery: HauptstadtImageGalleryBlock,
            Break: HauptstadtBreakBlock,
            Listicle: HauptstadtListicle,
            Subscribe: HauptstadtSubscribe,
          }}
          blockStyles={{
            FocusTeaser: HauptstadtFocusTeaser,
            AlternatingTeaser: HauptstadtAlternatingTeaser,
            TeaserSlider: HauptstadtTeaserSlider,
          }}
          date={{ format: dateFormatter }}
          meta={{ siteTitle }}
        >
          <ThemeProvider theme={theme}>
            <FontSizeProvider>
              <CssBaseline />
              {printStyles}

              <Head>
                <title key="title">{siteTitle}</title>
              </Head>

              <Spacer>
                <NavBar
                  categorySlugs={[['pages']]}
                  slug="main"
                  headerSlug="header"
                  iconSlug="icons"
                />

                <Main>
                  <Container maxWidth="lg">
                    <PrintLogo />
                    <Component {...pageProps} />
                  </Container>
                </Main>

                <FooterContainer
                  slug="main"
                  categorySlugs={[['pages']]}
                  iconSlug="icons"
                  hideBannerOnIntersecting={false}
                />
              </Spacer>

              <RoutedAdminBar />

              {settings?.analytics.googleAnalytics.enabled &&
                settings?.analytics.googleAnalytics.key && (
                  <GoogleAnalytics
                    gaId={settings.analytics.googleAnalytics.key}
                  />
                )}

              {settings?.analytics.googleTagManager.enabled &&
                settings?.analytics.googleTagManager.key && (
                  <GoogleTagManager
                    gtmId={settings.analytics.googleTagManager.key}
                  />
                )}

              {settings?.ads.sparkLoop.enabled &&
                settings?.ads.sparkLoop.key && (
                  <Script
                    src={`https://script.sparkloop.app/embed.js?publication_id=${settings.ads.sparkLoop.key}.js`}
                    strategy="lazyOnload"
                    data-sparkloop
                  />
                )}
            </FontSizeProvider>
          </ThemeProvider>
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </AppCacheProvider>
  );
}

const withApollo = createWithApiClient(getApiUrl(), [authLink, previewLink]);
const ConnectedApp = withApollo(
  withBuilderRouter(
    withErrorSnackbar(
      withPaywallBypassToken(
        withSessionProvider(
          withJwtHandler(withTrackFirstRoute(CustomApp)),
          AsyncSessionProvider
        )
      )
    )
  )
);

export { ConnectedApp as default };
