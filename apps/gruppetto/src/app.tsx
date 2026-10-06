import styled from '@emotion/styled';
import { Container, css, CssBaseline } from '@mui/material';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
  NavbarLink,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  Analytics,
  BuilderRouterProvider,
  Head,
  RoutedAdminBar,
  Script,
  WepublishLink,
  withJwtHandler,
  withSessionProvider,
} from '@wepublish/utils/website/tanstack';
import { WebsiteProvider } from '@wepublish/website';
import { WebsiteSettingsFragment } from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { PropsWithChildren } from 'react';

import background from './background.svg';
import { GruppettoBreakBlock } from './components/break-block';
import { Footer } from './components/footer';
import { SITE_TITLE } from './theme';

// Vite resolves an SVG import to a plain URL string. Next's loader returned a
// `StaticImageData` object, hence the `background.src` in the old `_app.tsx`.
const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  gap: ${({ theme }) => theme.spacing(3)};
  min-height: 100vh;
  background: url(${background});
  background-repeat: repeat-y;
  background-size: cover;
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

  ${NavbarLink}:nth-of-type(n + 3) {
    display: none;
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
  return (
    <WebsiteProvider>
      <WebsiteBuilderProvider
        meta={{ siteTitle: SITE_TITLE }}
        Head={Head}
        Script={Script}
        Footer={Footer}
        elements={{ Link: WepublishLink }}
        blocks={{ Break: GruppettoBreakBlock }}
      >
        <CssBaseline />

        <Spacer>
          <NavBar
            categorySlugs={[['account', 'issues', 'about-us']]}
            slug="main"
            headerSlug="header"
            iconSlug="icons"
          />

          <main>
            <MainSpacer maxWidth="lg">{children}</MainSpacer>
          </main>

          <FooterContainer
            slug="footer"
            categorySlugs={[[]]}
            iconSlug="icons"
          />
        </Spacer>

        <RoutedAdminBar />

        <Analytics websiteSettings={websiteSettings} />
      </WebsiteBuilderProvider>
    </WebsiteProvider>
  );
}

/**
 * `withSessionProvider` expects `props.pageProps.sessionToken`; there are no
 * page props any more, so hand it the shape it wants. The session itself is
 * restored from the cookie inside `SessionProvider` on the client, which is
 * what keeps the SSR response user-agnostic and therefore CDN cacheable.
 */
const Wrapped = withErrorSnackbar(
  withPaywallBypassToken(
    withSessionProvider(withJwtHandler(AppShell) as never) as never
  )
) as React.ComponentType<AppShellProps & { pageProps: object }>;

export const App = (props: AppShellProps) => (
  <BuilderRouterProvider>
    <Wrapped
      {...props}
      pageProps={{}}
    />
  </BuilderRouterProvider>
);
