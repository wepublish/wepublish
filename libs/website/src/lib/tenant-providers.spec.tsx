import { createTheme, ThemeOptions, useTheme } from '@mui/material';
import { render, screen } from '@testing-library/react';
import {
  useWebsiteBuilder,
  WebsiteTenantConfig,
} from '@wepublish/website/builder';
import { de } from 'date-fns/locale';
import { PropsWithChildren } from 'react';
import { TenantProviders } from './tenant-providers';

const TenantNavbar = () => <nav>tenant navbar</nav>;
const OverriddenNavbar = () => <nav>overridden navbar</nav>;

const Probe = () => {
  const theme = useTheme();
  const {
    Navbar,
    Footer,
    meta: { siteTitle },
    thirdParty,
  } = useWebsiteBuilder();

  return (
    <>
      <span data-testid="primary">{theme.palette.primary.main}</span>
      <span data-testid="site-title">{siteTitle}</span>
      <span data-testid="stripe">{thirdParty.stripe}</span>
      <span data-testid="navbar">{Navbar.name}</span>
      <span data-testid="has-footer">{String(!!Footer)}</span>
    </>
  );
};

const Wrapper = ({ children }: PropsWithChildren) => (
  <section data-testid="wrapper">{children}</section>
);

const GlobalStyles = () => <div data-testid="global-styles" />;

const config = (
  overrides: Partial<WebsiteTenantConfig> = {}
): WebsiteTenantConfig => ({
  id: 'test',
  name: 'Test',
  createTheme: settingsTheme =>
    createTheme(
      { palette: { primary: { main: '#123456' } } } as ThemeOptions,
      settingsTheme ?? {}
    ),
  builder: {
    Navbar: TenantNavbar,
    meta: { siteTitle: 'Tenant' },
  },
  translations: { lng: 'de' },
  dateLocale: de,
  ...overrides,
});

describe('TenantProviders', () => {
  it('applies the tenant theme and builder overrides on top of the defaults', () => {
    render(
      <TenantProviders config={config()}>
        <Probe />
      </TenantProviders>
    );

    expect(screen.getByTestId('primary').textContent).toBe('#123456');
    expect(screen.getByTestId('site-title').textContent).toBe('Tenant');
    expect(screen.getByTestId('navbar').textContent).toBe('TenantNavbar');
    expect(screen.getByTestId('has-footer').textContent).toBe('true');
  });

  it('passes the settings theme to createTheme', () => {
    render(
      <TenantProviders
        config={config()}
        settingsTheme={
          { palette: { primary: { main: '#abcdef' } } } as ThemeOptions
        }
      >
        <Probe />
      </TenantProviders>
    );

    expect(screen.getByTestId('primary').textContent).toBe('#abcdef');
  });

  it('lets extra builder props win over the tenant builder', () => {
    render(
      <TenantProviders
        config={config()}
        extra={{ Navbar: OverriddenNavbar, thirdParty: { stripe: 'pk_test' } }}
      >
        <Probe />
      </TenantProviders>
    );

    expect(screen.getByTestId('navbar').textContent).toBe('OverriddenNavbar');
    expect(screen.getByTestId('stripe').textContent).toBe('pk_test');
  });

  it('renders the tenant wrapper and global styles around the children', () => {
    render(
      <TenantProviders config={config({ Wrapper, GlobalStyles })}>
        <Probe />
      </TenantProviders>
    );

    const wrapper = screen.getByTestId('wrapper');

    expect(wrapper.contains(screen.getByTestId('global-styles'))).toBe(true);
    expect(wrapper.contains(screen.getByTestId('primary'))).toBe(true);
  });
});
