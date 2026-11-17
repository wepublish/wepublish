import styled from '@emotion/styled';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { withErrorSnackbar } from '@wepublish/errors/website';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { withPaywallBypassToken } from '@wepublish/paywall/website';
import {
  MainSpacer,
  reflektTenant,
  withPressAnimation,
} from '@wepublish/tenant/reflekt';
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
import { PropsWithChildren, useEffect, useRef } from 'react';

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

const ReflektLink = withPressAnimation(WepublishLink);

const elements = { ...reflektTenant.builder.elements, Link: ReflektLink };

const CONVERSION_EVENTS: Record<string, string[]> = {
  subscription: ['Payment success', 'Subscription success'],
  upgrade: ['Payment success', 'Subscription success'],
  invoice: ['Payment success'],
};

function PlausibleConversionEvents() {
  const { wepConversion } = useSearch({ strict: false }) as {
    wepConversion?: string;
  };
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || typeof wepConversion !== 'string') {
      return;
    }

    const events = CONVERSION_EVENTS[wepConversion];

    if (!events) {
      return;
    }

    handled.current = true;
    events.forEach(event =>
      window.plausible?.(event, { props: { type: wepConversion } })
    );

    void navigate({
      to: '.',
      search: (previous: Record<string, unknown>) => {
        const { wepConversion: _wepConversion, ...rest } = previous;

        return rest;
      },
      replace: true,
      resetScroll: false,
    } as never);
  }, [wepConversion, navigate]);

  return null;
}

type AppShellProps = PropsWithChildren<{
  websiteSettings: WebsiteSettingsFragment | undefined;
}>;

function AppShell({ websiteSettings, children }: AppShellProps) {
  const shell = useWebsiteShell();

  return (
    <TenantProviders
      config={reflektTenant}
      extra={{ Head, Script, elements }}
    >
      <PlausibleConversionEvents />

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
          <MainSpacer maxWidth="lg">{children}</MainSpacer>
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

      <Analytics websiteSettings={websiteSettings} />
    </TenantProviders>
  );
}

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
