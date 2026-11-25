import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Container, CssBaseline, ThemeOptions } from '@mui/material';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
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

import { neuewegeConfig } from './config';

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
      config={neuewegeConfig}
      settingsTheme={websiteSettings?.theme as ThemeOptions | undefined}
      extra={{ Head, Script, elements: { Link: WepublishLink } }}
    >
      <CssBaseline />

      <Spacer>
        {shell.showNavigation && (
          <NavBar
            categorySlugs={[['categories', 'about-us']]}
            slug="main"
            headerSlug="header"
            iconSlug="icons"
          />
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
