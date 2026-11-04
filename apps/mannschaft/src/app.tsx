import { CssBaseline } from '@mui/material';
import { withErrorSnackbar } from '@wepublish/errors/website';
import { FooterContainer } from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  MainSpacer,
  mannschaftConfig,
  MannschaftButtonLink,
  MannschaftNavbar,
  MannschaftSpacer,
} from '@wepublish/tenant/mannschaft';
import { withJwtHandler, withSessionProvider } from '@wepublish/utils/website';
import {
  Analytics,
  BuilderRouterProvider,
  Head,
  RoutedAdminBar,
  Script,
  useRouteSessionToken,
  useWebsiteShell,
  WepublishLink,
} from '@wepublish/utils/website/tanstack';
import { TenantProviders } from '@wepublish/website';
import { WebsiteSettingsFragment } from '@wepublish/website/api';
import { PropsWithChildren, useEffect } from 'react';
import { AdConfig } from 'react-ad-manager';
import { FaBluesky, FaInstagram, FaTiktok } from 'react-icons/fa6';
import { MdFacebook, MdSearch } from 'react-icons/md';

import { PURModel } from './cookie-or-pay/pur-model';
import { initOneSignal } from './one-signal';

let oneSignalInitialized = false;

type AppShellProps = PropsWithChildren<{
  websiteSettings: WebsiteSettingsFragment | undefined;
}>;

/**
 * Everything the old `pages/_app.tsx` rendered *inside* the Apollo provider.
 *
 * Deliberately **no** `<title>` here: React 19 hoists metadata in render order
 * and does not deduplicate titles, so a default title in the shell would
 * always beat the per-page `PageSEO`/`ArticleSEO` title. Routes without an SEO
 * component set their own title through the route's `head()`.
 */
function AppShell({ websiteSettings, children }: AppShellProps) {
  const shell = useWebsiteShell();

  useEffect(() => {
    if (oneSignalInitialized) {
      return;
    }

    oneSignalInitialized = true;
    void initOneSignal();
  }, []);

  return (
    <TenantProviders
      config={mannschaftConfig}
      extra={{ Head, Script, elements: { Link: WepublishLink } }}
    >
      <CssBaseline />

      <Head>
        <AdConfig collapseEmptyDivs={'collapse'} />
      </Head>

      <MannschaftSpacer>
        {shell.showNavigation && (
          <MannschaftNavbar
            categorySlugs={[['categories', 'other'], ['about-us']]}
            slug="main"
            headerSlug="header"
            iconSlug="icons"
          >
            <MannschaftButtonLink href="/search">
              <MdSearch size="32" />
            </MannschaftButtonLink>

            <MannschaftButtonLink href="https://www.facebook.com/mannschaftmagazin">
              <MdFacebook size="32" />
            </MannschaftButtonLink>

            <MannschaftButtonLink href="https://www.instagram.com/mannschaftmagazin">
              <FaInstagram size="32" />
            </MannschaftButtonLink>

            <MannschaftButtonLink href="https://bsky.app/profile/mannschaftmagazin.bsky.social">
              <FaBluesky size="32" />
            </MannschaftButtonLink>

            <MannschaftButtonLink href="https://www.tiktok.com/@mannschaftmagazin">
              <FaTiktok size="32" />
            </MannschaftButtonLink>
          </MannschaftNavbar>
        )}

        <main>
          <MainSpacer maxWidth="lg">{children}</MainSpacer>
        </main>

        {shell.showFooter && (
          <FooterContainer
            slug="footer"
            categorySlugs={[['categories', 'about-us']]}
            iconSlug="icons"
          />
        )}
      </MannschaftSpacer>

      <RoutedAdminBar />

      <PURModel />

      <Analytics websiteSettings={websiteSettings} />

      <Script
        strategy="lazyOnload"
        src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
      />
    </TenantProviders>
  );
}

/**
 * `withSessionProvider` expects `props.pageProps.sessionToken`; there are no
 * page props any more, so hand it the shape it wants. The token comes from
 * whichever matched route authenticated, so the first render already knows who
 * is reading — see `useRouteSessionToken`.
 */
const Wrapped = withErrorSnackbar(
  withPaywallBypassToken(
    withSessionProvider(withJwtHandler(AppShell) as never) as never
  )
) as React.ComponentType<AppShellProps & { pageProps: object }>;

export const App = (props: AppShellProps) => {
  const sessionToken = useRouteSessionToken();

  return (
    <BuilderRouterProvider>
      <Wrapped
        {...props}
        pageProps={{ sessionToken: sessionToken ?? undefined }}
      />
    </BuilderRouterProvider>
  );
};
