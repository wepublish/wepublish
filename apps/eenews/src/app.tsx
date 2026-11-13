import styled from '@emotion/styled';
import { CssBaseline } from '@mui/material';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  AdblockOverlay,
  Advertisement,
  eenewsConfig,
  eenewsTheme,
  ReviveScript,
} from '@wepublish/tenant/eenews';
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
import { PropsWithChildren } from 'react';

const Spacer = styled('div')`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  min-height: 100vh;
`;

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`;

const MainContent = styled('main')`
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    min(var(--max-width), 100%)
    minmax(0, 1fr);
  width: 100%;

  ${eenewsTheme.breakpoints.up('md')} {
    min-height: max(100vh, 700px);
  }
`;

const ContentArea = styled('div')`
  grid-row: 1;
  grid-column: 1 / -1;
  min-width: 0;
`;

const SkyscraperPlacer = styled('div')`
  display: none;
  grid-row: 1;
  grid-column: 3 / 4;
  justify-self: start;
  margin-left: ${eenewsTheme.spacing(4)};
  z-index: 1;

  @media (min-width: 1520px) {
    display: block;
  }
`;

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

  return (
    <TenantProviders
      config={eenewsConfig}
      extra={{ Head, Script, elements: { Link: WepublishLink } }}
    >
      <CssBaseline />

      <ReviveScript />

      <AdblockOverlay />

      <Spacer>
        {shell.showNavigation && (
          <NavBar
            slug="main"
            headerSlug="header"
            categorySlugs={[
              [
                'mega-themen',
                'mega-dossiers',
                'mega-region',
                'mega-about',
                'mega-about-secondary',
              ],
            ]}
          />
        )}

        <MainContent>
          <ContentArea>{children}</ContentArea>
          <SkyscraperPlacer>
            <Advertisement type="skyscraper" />
          </SkyscraperPlacer>
        </MainContent>

        {shell.showFooter && (
          <FooterContainer
            slug="footer-konto"
            categorySlugs={[['footer-themen', 'footer-magazin']]}
          />
        )}
      </Spacer>

      <RoutedAdminBar />

      <Analytics websiteSettings={websiteSettings} />
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
