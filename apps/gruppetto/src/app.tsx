import { CssBaseline } from '@mui/material';
import { withErrorSnackbar } from '@wepublish/errors/website';
import { FooterContainer } from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import { withJwtHandler, withSessionProvider } from '@wepublish/utils/website';
import {
  Analytics,
  BuilderRouterProvider,
  Head,
  RoutedAdminBar,
  Script,
  useWebsiteShell,
  WepublishLink,
} from '@wepublish/utils/website/tanstack';
import { WebsiteProvider } from '@wepublish/website';
import { WebsiteSettingsFragment } from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { PropsWithChildren } from 'react';

import {
  GruppettoBreakBlock,
  GruppettoFooter,
  GruppettoMainSpacer,
  GruppettoNavBar,
  GruppettoSpacer,
  gruppettoTenant,
} from '@wepublish/tenant/gruppetto';

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
    <WebsiteProvider>
      <WebsiteBuilderProvider
        meta={gruppettoTenant.builder.meta}
        Head={Head}
        Script={Script}
        Footer={GruppettoFooter}
        elements={{ Link: WepublishLink }}
        blocks={{ Break: GruppettoBreakBlock }}
      >
        <CssBaseline />

        <GruppettoSpacer>
          {shell.showNavigation && (
            <GruppettoNavBar
              categorySlugs={[['account', 'issues', 'about-us']]}
              slug="main"
              headerSlug="header"
              iconSlug="icons"
            />
          )}

          <main>
            <GruppettoMainSpacer maxWidth="lg">
              {children}
            </GruppettoMainSpacer>
          </main>

          {shell.showFooter && (
            <FooterContainer
              slug="footer"
              categorySlugs={[[]]}
              iconSlug="icons"
            />
          )}
        </GruppettoSpacer>

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
