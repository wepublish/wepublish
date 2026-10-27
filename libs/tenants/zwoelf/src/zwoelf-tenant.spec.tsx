import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockNavigations,
  mockTeaserListBlock,
  mockTitleBlock,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { de } from 'date-fns/locale';

import { ZwoelfBaseTeaser } from './components/zwoelf-base-teaser';
import { ZwoelfFocusTeaser } from './components/zwoelf-focus-teaser';
import deOverriden from './locales/deOverriden.json';
import theme from './theme';
import { zwoelfTenant } from './zwoelf-tenant';

describe('zwoelfTenant', () => {
  it('identifies the tenant', () => {
    expect(zwoelfTenant.id).toBe('zwoelf');
    expect(zwoelfTenant.builder.meta?.siteTitle).toBe('Zwölf');
  });

  it('returns the zwoelf theme', () => {
    expect(zwoelfTenant.createTheme()).toBe(theme);
  });

  it('carries the german translation overrides and date locale', () => {
    expect(zwoelfTenant.translations).toEqual({
      lng: 'de',
      overrides: { de: deOverriden },
    });
    expect(zwoelfTenant.dateLocale).toBe(de);
  });

  it('overrides the base teaser and the focus teaser block style', () => {
    expect(zwoelfTenant.builder.blocks).toEqual({
      BaseTeaser: ZwoelfBaseTeaser,
    });
    expect(zwoelfTenant.builder.blockStyles).toEqual({
      FocusTeaser: ZwoelfFocusTeaser,
    });
    expect(zwoelfTenant.builder.elements?.Link).toBeDefined();
  });

  it('does not inject next specific builder props', () => {
    expect(zwoelfTenant.builder).not.toHaveProperty('Head');
    expect(zwoelfTenant.builder).not.toHaveProperty('Script');
    expect(zwoelfTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the zwoelf way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(zwoelfTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(zwoelfTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });
});

const TenantPage = ({ blocks }: { blocks: FullBlockFragment[] }) => {
  const {
    Navbar,
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return (
    <>
      <Navbar
        data={{ __typename: 'Query', navigations: mockNavigations() }}
        loading={false}
        slug="main"
        categorySlugs={[['about']]}
        headerSlug="header"
        iconSlug="icons"
        hasRunningSubscription={false}
        hasUnpaidInvoices={false}
        subscribeBtn={{
          href: 'https://shop.zwoelf.ch/produkt-kategorie/abos/',
          target: '_blank',
        }}
      />

      <Blocks
        blocks={blocks}
        type="Page"
      />
    </>
  );
};

const renderTenantPage = (blocks: FullBlockFragment[] = []) =>
  renderWithProviders(<TenantPage blocks={blocks} />, {
    tenant: zwoelfTenant,
  });

describe('a page rendered with the zwoelf tenant', () => {
  beforeAll(() => applyTenantTranslations(zwoelfTenant));
  afterAll(() => resetTranslations());

  it('sends readers to the zwoelf shop to buy a subscription', () => {
    renderTenantPage();

    expect(
      screen.getByRole('link', { name: deOverriden.navbar.subscribe })
    ).toHaveAttribute('href', 'https://shop.zwoelf.ch/produkt-kategorie/abos/');
  });

  it('sets the block titles in Hanken Grotesk', () => {
    renderTenantPage([
      mockTitleBlock({ title: 'Das Magazin für Fussballkultur' }),
    ]);

    expect(
      getComputedStyle(
        screen.getByRole('heading', { name: 'Das Magazin für Fussballkultur' })
      ).fontFamily
    ).toContain('Hanken Grotesk');
  });

  it('renders focus teaser lists with the zwoelf block style', () => {
    renderTenantPage([
      mockTeaserListBlock({
        blockStyle: 'Focus',
        title: 'Im Fokus',
        teasers: [mockArticleTeaser({ title: 'Der Fokus-Artikel' })],
      }),
    ]);

    expect(
      getComputedStyle(
        screen.getByRole('heading', { name: 'Im Fokus' })
          .parentElement as HTMLElement
      ).backgroundColor
    ).toBe(theme.palette.primary.main);
  });
});
