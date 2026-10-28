import { screen } from '@testing-library/react';
import {
  mockBreakBlock,
  mockNavigations,
  mockTitleBlock,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { de } from 'date-fns/locale';

import { FlimmerBreakBlock } from './components/flimmer-break-block';
import { FlimmerNavbar } from './components/flimmer-navbar';
import { FlimmerPaymentAmountPicker } from './components/flimmer-payment-amount-picker';
import { FlimmerRichText } from './components/flimmer-richtext';
import { FlimmerTeaser } from './components/flimmer-teaser';
import { FlimmerTitle } from './components/flimmer-title';
import { flimmerTenant } from './flimmer-tenant';
import deOverriden from './locales/deOverriden.json';
import theme from './theme';

describe('flimmerTenant', () => {
  it('identifies the tenant', () => {
    expect(flimmerTenant.id).toBe('flimmer');
    expect(flimmerTenant.builder.meta?.siteTitle).toBe('Flimmer');
  });

  it('returns the flimmer theme', () => {
    expect(flimmerTenant.createTheme()).toBe(theme);
  });

  it('carries the german translation overrides and date locale', () => {
    expect(flimmerTenant.translations).toEqual({
      lng: 'de',
      overrides: { de: deOverriden },
    });
    expect(flimmerTenant.dateLocale).toBe(de);
  });

  it('overrides the navbar, the payment amount picker and the blocks', () => {
    expect(flimmerTenant.builder.Navbar).toBe(FlimmerNavbar);
    expect(flimmerTenant.builder.PaymentAmountPicker).toBe(
      FlimmerPaymentAmountPicker
    );
    expect(flimmerTenant.builder.blocks).toEqual({
      BaseTeaser: FlimmerTeaser,
      Break: FlimmerBreakBlock,
      RichText: FlimmerRichText,
      Title: FlimmerTitle,
    });
    expect(flimmerTenant.builder.elements?.Link).toBeDefined();
  });

  it('does not inject next specific builder props', () => {
    expect(flimmerTenant.builder).not.toHaveProperty('Head');
    expect(flimmerTenant.builder).not.toHaveProperty('Script');
    expect(flimmerTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the flimmer way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(flimmerTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(flimmerTenant.builder.date?.format?.(date, false)).toBe(
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
        categorySlugs={[['categories', 'about']]}
        headerSlug="header"
        iconSlug="icons"
        hasRunningSubscription={false}
        hasUnpaidInvoices={false}
      />

      <Blocks
        blocks={blocks}
        type="Page"
      />
    </>
  );
};

const ancestorBackgrounds = (element: Element | null): string[] =>
  element ?
    [
      getComputedStyle(element).backgroundColor,
      ...ancestorBackgrounds(element.parentElement),
    ]
  : [];

const renderTenantPage = (blocks: FullBlockFragment[] = []) =>
  renderWithProviders(<TenantPage blocks={blocks} />, {
    tenant: flimmerTenant,
  });

describe('a page rendered with the flimmer tenant', () => {
  beforeAll(() => applyTenantTranslations(flimmerTenant));
  afterAll(() => resetTranslations());

  it('asks readers to support flimmer in the navbar', () => {
    renderTenantPage();

    expect(
      screen.getByRole('link', { name: deOverriden.navbar.subscribe })
    ).toBeInTheDocument();
  });

  it('paints the page in the flimmer background colour', () => {
    renderTenantPage();

    expect(getComputedStyle(document.body).backgroundColor).toBe(
      theme.palette.background.default
    );
  });

  it('sets the block titles in Rubik', () => {
    renderTenantPage([
      mockTitleBlock({ title: 'Was Kinder auf Bildschirmen sehen' }),
    ]);

    expect(
      getComputedStyle(
        screen.getByRole('heading', {
          name: 'Was Kinder auf Bildschirmen sehen',
        })
      ).fontFamily
    ).toContain('Rubik');
  });

  it('puts the break block on the accent colour', () => {
    renderTenantPage([
      mockBreakBlock({ text: 'Flimmer braucht dich', image: null }),
    ]);

    expect(
      ancestorBackgrounds(screen.getByText('Flimmer braucht dich'))
    ).toContain(theme.palette.accent.main);
  });
});
