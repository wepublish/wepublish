import styled from '@emotion/styled';
import { Container, css, ThemeOptions } from '@mui/material';
import { useLocation } from '@tanstack/react-router';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import { courantConfig, courantTokens } from '@wepublish/tenant/factuel';
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

const { shell: shellTokens } = courantTokens.layout;

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  gap: ${({ theme }) => theme.spacing(shellTokens.gap)};
  min-height: 100vh;
`;

// Courant: max-content width is 1200px, regardless of theme breakpoints.
const MainSpacer = styled(Container)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(shellTokens.mainGap)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(shellTokens.desktopMainGap)};
    }
  `}

  &.page-measure {
    max-width: ${courantTokens.layout.pageMaxWidth}px;
  }
`;

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: ${shellTokens.navbarZIndex};
`;

type AppShellProps = PropsWithChildren<{
  websiteSettings: WebsiteSettingsFragment | undefined;
}>;

/**
 * Everything the old `pages/_app.tsx` rendered *inside* the Apollo provider.
 *
 * `TenantProviders` builds the theme from the website settings, exactly as the
 * Next app did — factuel's palette and fonts come from the CMS, not the lib.
 *
 * Deliberately **no** `<title>` here: React 19 hoists metadata in render order
 * and does not deduplicate titles, so a default title in the shell would
 * always beat the per-page `PageSEO`/`ArticleSEO` title. Routes without an SEO
 * component set their own title through the route's `head()`.
 */
function AppShell({ websiteSettings, children }: AppShellProps) {
  const shell = useWebsiteShell();
  const { pathname } = useLocation();
  const isArticle = pathname.startsWith('/a/');

  return (
    <TenantProviders
      config={courantConfig}
      settingsTheme={websiteSettings?.theme as ThemeOptions | undefined}
      extra={{ Head, Script, elements: { Link: WepublishLink } }}
    >
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
          <MainSpacer
            maxWidth="lg"
            className={isArticle ? undefined : 'page-measure'}
          >
            {children}
          </MainSpacer>
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
 * page props any more, so hand it the shape it wants. See gruppetto's
 * `app.tsx` and `useRouteSessionToken` for why the token must be there on the
 * first render.
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
