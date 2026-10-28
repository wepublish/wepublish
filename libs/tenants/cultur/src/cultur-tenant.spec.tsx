import { screen } from '@testing-library/react';
import {
  mockBreakBlock,
  mockNavigations,
  mockTitleBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { de } from 'date-fns/locale';
import { t } from 'i18next';

import { CulturBreakBlock } from './components/cultur-break';
import { CulturNavbar } from './components/cultur-navbar';
import { CulturTeaser } from './components/cultur-teaser';
import { Footer } from './components/footer';
import { culturTenant } from './cultur-tenant';
import theme from './theme';

describe('culturTenant', () => {
  it('identifies the tenant', () => {
    expect(culturTenant.id).toBe('cultur');
    expect(culturTenant.name).toBe('Cültür');
    expect(culturTenant.builder.meta?.siteTitle).toBe('Cültür');
  });

  it('returns the cultur theme', () => {
    expect(culturTenant.createTheme()).toBe(theme);
  });

  it('uses the default german translations and date locale', () => {
    expect(culturTenant.translations).toEqual({ lng: 'de' });
    expect(culturTenant.dateLocale).toBe(de);
  });

  it('overrides the navbar, the footer and the blocks', () => {
    expect(culturTenant.builder.Navbar).toBe(CulturNavbar);
    expect(culturTenant.builder.Footer).toBe(Footer);
    expect(culturTenant.builder.blocks).toEqual({
      BaseTeaser: CulturTeaser,
      Break: CulturBreakBlock,
    });
    expect(culturTenant.builder.elements?.Link).toBeDefined();
  });

  it('does not inject next specific builder props', () => {
    expect(culturTenant.builder).not.toHaveProperty('Head');
    expect(culturTenant.builder).not.toHaveProperty('Script');
    expect(culturTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the cultur way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(culturTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(culturTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });
});

const navigation = {
  data: { __typename: 'Query' as const, navigations: mockNavigations() },
  loading: false,
  slug: 'main',
  categorySlugs: [['categories']],
};

const TenantPage = ({ blocks }: { blocks: FullBlockFragment[] }) => {
  const {
    Navbar,
    Footer,
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return (
    <>
      <Navbar
        {...navigation}
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
        iconSlug="icons"
        wepublishLogo="hidden"
      />
    </>
  );
};

const renderTenantPage = (blocks: FullBlockFragment[] = []) =>
  renderWithProviders(<TenantPage blocks={blocks} />, {
    tenant: culturTenant,
  });

const ancestorBackgrounds = (element: Element | null): string[] =>
  element ?
    [
      getComputedStyle(element).backgroundColor,
      ...ancestorBackgrounds(element.parentElement),
    ]
  : [];

describe('a page rendered with the cultur tenant', () => {
  it('keeps the default subscribe label in the navbar', () => {
    renderTenantPage();

    expect(
      screen.getByRole('link', { name: t('navbar.subscribe') })
    ).toBeInTheDocument();
  });

  it('sets the block titles in Open Sans', () => {
    renderTenantPage([
      mockTitleBlock({ title: 'Was diese Woche in der Stadt läuft' }),
    ]);

    expect(
      getComputedStyle(
        screen.getByRole('heading', {
          name: 'Was diese Woche in der Stadt läuft',
        })
      ).fontFamily
    ).toContain('Open Sans');
  });

  it('puts the break block on the dark contrast colour', () => {
    renderTenantPage([
      mockBreakBlock({ text: 'Cültür braucht dich', image: null }),
    ]);

    expect(
      ancestorBackgrounds(screen.getByText('Cültür braucht dich'))
    ).toContain(theme.palette.primary.contrastText);
  });

  it('puts the footer on the cultur yellow', () => {
    renderTenantPage();

    expect(
      ancestorBackgrounds(screen.getByRole('link', { name: 'Mobilität' }))
    ).toContain(theme.palette.primary.main);
  });
});
