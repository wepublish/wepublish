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
import { ReflektCrowdfundingBlock } from '../src/components/reflekt-crowdfunding-block';
import { RefFooter } from '../src/components/reflekt-footer';
import { ReflektGlobalStyles } from '../src/components/reflekt-global-styles';
import { ReflektGoodiePicker } from '../src/components/reflekt-goodie-picker';
import { ReflektImageBlock } from '../src/components/reflekt-image-block';
import { ReflektImageSlider } from '../src/components/reflekt-image-slider';
import { ReflektLink } from '../src/components/reflekt-link';
import {
  ReflektListItem,
  ReflektUnorderedList,
} from '../src/components/reflekt-lists';
import { ReflektLoginForm } from '../src/components/reflekt-login-form';
import { ReflektMemberPlanPicker } from '../src/components/reflekt-memberplan-picker';
import { ReflektMemberPlanItem } from '../src/components/reflekt-memberplan-picker-item';
import { ReflektUpgrade } from '../src/components/reflekt-upgrade';
import { ReflektModal } from '../src/components/reflekt-modal';
import { ReflektNavbar } from '../src/components/reflekt-navbar';
import { ReflektPage } from '../src/components/reflekt-page';
import { ReflektQuoteBlock } from '../src/components/reflekt-quote-block';
import { ReflektRegistrationForm } from '../src/components/reflekt-registration-form';
import { ReflektRenderElement } from '../src/components/reflekt-render-element';
import { ReflektRenderLeaf } from '../src/components/reflekt-render-leaf';
import { ReflektRenderRichtext } from '../src/components/reflekt-render-richtext';
import { ReflektRichTextBlock } from '../src/components/reflekt-richtext-block';
import {
  ReflektSubscribeBlock,
  ReflektSubscribeForm,
} from '../src/components/reflekt-subscribe';
import { ReflektSubscriptionListItem } from '../src/components/reflekt-subscription-list-item';
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
  const siteTitle = 'Reflekt';

  // Emotion cache from _document is not supplied when client side rendering
  // Compat removes certain warnings that are irrelevant to us
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
              Upgrade={ReflektUpgrade}
              GoodiePicker={ReflektGoodiePicker}
              MemberPlanPicker={ReflektMemberPlanPicker}
              MemberPlanItem={ReflektMemberPlanItem}
              UserForm={ReflektUserForm}
              LoginForm={ReflektLoginForm}
              RegistrationForm={ReflektRegistrationForm}
              SubscriptionListItem={ReflektSubscriptionListItem}
              elements={{
                Link: ReflektLink,
                UnorderedList: ReflektUnorderedList,
                ListItem: ReflektListItem,
                Modal: ReflektModal,
              }}
              date={{ format: dateFormatter }}
              meta={{ siteTitle }}
              richtext={{
                RenderElement: ReflektRenderElement,
                RenderRichtext: ReflektRenderRichtext,
                RenderLeaf: ReflektRenderLeaf,
              }}
              blockStyles={{
                ImageSlider: ReflektImageSlider,
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
                Subscribe: ReflektSubscribeBlock,
                Image: ReflektImageBlock,
                Crowdfunding: ReflektCrowdfundingBlock,
              }}
            >
              <CssBaseline />
              <ReflektGlobalStyles />

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
                    categorySlugs={[['main']]}
                    slug="main"
                    headerSlug="header"
                    iconSlug="icons"
                  />
                )}

                <main>
                  <MainSpacer maxWidth="lg">
                    <Component {...pageProps} />
                  </MainSpacer>
                </main>

                {shell.showFooter && (
                  <FooterContainer
                    slug="footer"
                    categorySlugs={[['footer']]}
                    iconSlug="icons"
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
