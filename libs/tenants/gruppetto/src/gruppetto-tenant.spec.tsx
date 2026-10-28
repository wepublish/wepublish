import { screen } from '@testing-library/react';
import {
  mockNavigations,
  mockTitleBlock,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { de } from 'date-fns/locale';

import { GruppettoBreakBlock } from './components/gruppetto-break-block';
import { GruppettoFooter } from './components/gruppetto-footer';
import { gruppettoTenant } from './gruppetto-tenant';
import deOverriden from './locales/deOverriden.json';
import theme from './theme';

describe('gruppettoTenant', () => {
  it('identifies the tenant', () => {
    expect(gruppettoTenant.id).toBe('gruppetto');
    expect(gruppettoTenant.builder.meta?.siteTitle).toBe(
      'Gruppetto - Das neue Schweizer Radsportmagazin'
    );
  });

  it('returns the gruppetto theme', () => {
    expect(gruppettoTenant.createTheme()).toBe(theme);
    expect(theme.palette.primary.main).toBe('#F084AD');
    expect(theme.palette.primary.dark).toBe('#BC4D77');
    expect(theme.palette.background.default).toBe('#FFFAFC');
    expect(theme.shape.borderRadius).toBe(3);
  });

  it('carries the german translation overrides and date locale', () => {
    expect(gruppettoTenant.translations).toEqual({
      lng: 'de',
      overrides: { de: deOverriden },
    });
    expect(gruppettoTenant.dateLocale).toBe(de);
  });

  it('overrides the footer and the break block', () => {
    expect(gruppettoTenant.builder.Footer).toBe(GruppettoFooter);
    expect(gruppettoTenant.builder.blocks).toEqual({
      Break: GruppettoBreakBlock,
    });
    expect(gruppettoTenant.builder.elements?.Link).toBeDefined();
  });

  it('keeps the default date formatter', () => {
    expect(gruppettoTenant.builder).not.toHaveProperty('date');
  });

  it('does not inject next specific builder props', () => {
    expect(gruppettoTenant.builder).not.toHaveProperty('Head');
    expect(gruppettoTenant.builder).not.toHaveProperty('Script');
    expect(gruppettoTenant.builder).not.toHaveProperty('thirdParty');
  });
});

const TenantPage = ({ blocks }: { blocks: FullBlockFragment[] }) => {
  const {
    Navbar,
    Footer,
    blocks: { Blocks },
  } = useWebsiteBuilder();

  const navigation = {
    data: { __typename: 'Query' as const, navigations: mockNavigations() },
    loading: false,
    slug: 'main',
  };

  return (
    <>
      <Navbar
        {...navigation}
        categorySlugs={[['about']]}
        headerSlug="header"
        iconSlug="icons"
        hasRunningSubscription={false}
        hasUnpaidInvoices={false}
      />

      <Blocks
        blocks={blocks}
        type="Page"
      />

      <Footer
        {...navigation}
        categorySlugs={[[]]}
        iconSlug="icons"
        wepublishLogo="hidden"
      />
    </>
  );
};

const renderTenantPage = (blocks: FullBlockFragment[] = []) =>
  renderWithProviders(<TenantPage blocks={blocks} />, {
    tenant: gruppettoTenant,
  });

describe('a page rendered with the gruppetto tenant', () => {
  beforeAll(() => applyTenantTranslations(gruppettoTenant));
  afterAll(() => resetTranslations());

  it('asks readers to buy a subscription in the navbar', () => {
    renderTenantPage();

    expect(
      screen.getByRole('link', { name: deOverriden.navbar.subscribe })
    ).toBeInTheDocument();
  });

  it('paints the page in the gruppetto background colour', () => {
    renderTenantPage();

    expect(getComputedStyle(document.body).backgroundColor).toBe(
      theme.palette.background.default
    );
  });

  it('sets the block titles in Roboto', () => {
    renderTenantPage([
      mockTitleBlock({ title: 'Das neue Schweizer Radsportmagazin' }),
    ]);

    expect(
      getComputedStyle(
        screen.getByRole('heading', {
          name: 'Das neue Schweizer Radsportmagazin',
        })
      ).fontFamily
    ).toContain('Roboto');
  });
});
