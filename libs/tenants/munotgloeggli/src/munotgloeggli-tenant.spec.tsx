import { Button, ThemeOptions } from '@mui/material';
import { screen } from '@testing-library/react';
import {
  mockCrowdfunding,
  mockCrowdfundingBlock,
  mockNavigations,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { minimalTheme } from '@wepublish/ui';
import { CrowdfundingGoalType } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { de } from 'date-fns/locale';

import { MunotgloeggliCrowdfundingBlock } from './components/website-builder-overwrites/blocks/crowdfunding';
import { MunotgloeggliBaseTeaser } from './components/website-builder-overwrites/blocks/teaser';
import websiteSettings from './fixtures/website-settings.json';
import deOverriden from './locales/deOverriden.json';
import { munotgloeggliTenant } from './munotgloeggli-tenant';

describe('munotgloeggliTenant', () => {
  it('identifies the tenant', () => {
    expect(munotgloeggliTenant.id).toBe('munotgloeggli');
    expect(munotgloeggliTenant.builder.meta).toEqual({
      siteTitle: 'Munotglöggli',
    });
  });

  it('builds the font theme on top of the minimal theme', () => {
    const theme = munotgloeggliTenant.createTheme();

    expect(theme.palette.primary.main).toBe(minimalTheme.palette.primary.main);
    expect(theme.typography.h1.fontFamily).toBe('local,sans-serif');
    expect(theme.typography.body1.fontFamily).toBe('local,sans-serif');
  });

  it('lets the website settings theme win over the font theme', () => {
    const theme = munotgloeggliTenant.createTheme({
      palette: { primary: { main: '#123456' } },
      typography: {
        h1: { fontFamily: 'Settings Font' },
      },
    });

    expect(theme.palette.primary.main).toBe('#123456');
    expect(theme.typography.h1.fontFamily).toBe('Settings Font');
    expect(theme.typography.h2.fontFamily).toBe('local,sans-serif');
  });

  it('carries the german translation overrides and date locale', () => {
    expect(munotgloeggliTenant.translations).toEqual({
      lng: 'de',
      overrides: { de: deOverriden },
    });
    expect(munotgloeggliTenant.dateLocale).toBe(de);
  });

  it('overrides the blocks the app overrode', () => {
    expect(munotgloeggliTenant.builder.elements?.Link).toBeDefined();
    expect(munotgloeggliTenant.builder.blocks).toEqual({
      BaseTeaser: MunotgloeggliBaseTeaser,
      Crowdfunding: MunotgloeggliCrowdfundingBlock,
    });
  });

  it('does not inject next specific builder props', () => {
    expect(munotgloeggliTenant.builder).not.toHaveProperty('Head');
    expect(munotgloeggliTenant.builder).not.toHaveProperty('Script');
    expect(munotgloeggliTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the munotgloeggli way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(munotgloeggliTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(munotgloeggliTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });
});

const munotgloeggliWithSettings = {
  ...munotgloeggliTenant,
  createTheme: () =>
    munotgloeggliTenant.createTheme(websiteSettings.theme as ThemeOptions),
};

const TenantPage = () => {
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
        categorySlugs={[['categories']]}
        headerSlug="header"
        iconSlug="icons"
        hasRunningSubscription={false}
        hasUnpaidInvoices={false}
      />

      <Button
        variant="contained"
        color="primary"
      >
        Spenden
      </Button>

      <Blocks
        blocks={[
          mockCrowdfundingBlock({
            crowdfunding: mockCrowdfunding({
              goalType: CrowdfundingGoalType.Subscription,
              subscriptions: 120,
            }),
          }),
        ]}
        type="Page"
      />
    </>
  );
};

const renderTenantPage = () =>
  renderWithProviders(<TenantPage />, { tenant: munotgloeggliWithSettings });

describe('a page rendered with the munotgloeggli tenant and its website settings', () => {
  beforeAll(() => applyTenantTranslations(munotgloeggliTenant));
  afterAll(() => resetTranslations());

  it('uses the primary colour from the website settings', () => {
    renderTenantPage();

    expect(
      getComputedStyle(screen.getByRole('button', { name: 'Spenden' }))
        .backgroundColor
    ).toBe(websiteSettings.theme.palette.primary.main);
  });

  it('asks readers to become members in the navbar', () => {
    renderTenantPage();

    expect(
      screen.getByRole('link', { name: deOverriden.navbar.subscribe })
    ).toBeInTheDocument();
  });

  it('says how many people joined the crowdfunding, not subscribed', () => {
    renderTenantPage();

    expect(screen.getByText(/Personen sind dabei/)).toHaveTextContent(
      'Bereits 120 Personen sind dabei'
    );
  });
});
