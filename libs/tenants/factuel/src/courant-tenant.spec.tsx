import { Button, createTheme, ThemeOptions } from '@mui/material';
import { screen } from '@testing-library/react';
import { mockTitleBlock, renderWithProviders } from '@wepublish/mocks/website';
import { minimalTheme } from '@wepublish/ui';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { fr } from 'date-fns/locale';

import { CourantContentWrapper } from './components/courant-content-wrapper';
import { CourantFooter } from './components/courant-footer';
import { CourantNavbar } from './components/courant-navbar';
import { courantTenant } from './courant-tenant';
import websiteSettings from './fixtures/website-settings.json';
import frOverridden from './locales/frOverridden.json';

describe('courantTenant', () => {
  it('identifies the tenant', () => {
    expect(courantTenant.id).toBe('factuel');
    expect(courantTenant.builder.meta).toEqual({
      siteTitle: 'Courant',
      locale: 'fr-CH',
    });
  });

  it('builds the minimal theme when no settings theme is given', () => {
    const theme = courantTenant.createTheme();

    expect(theme.palette.primary.main).toBe(minimalTheme.palette.primary.main);
    expect(theme.typography.fontFamily).toBe(
      createTheme(minimalTheme, {}).typography.fontFamily
    );
  });

  it('lets the website settings theme win over the minimal theme', () => {
    const theme = courantTenant.createTheme({
      palette: { primary: { main: '#123456' } },
      typography: { fontFamily: 'Settings Font' },
    });

    expect(theme.palette.primary.main).toBe('#123456');
    expect(theme.typography.fontFamily).toBe('Settings Font');
  });

  it('carries the french translation overrides and date locale', () => {
    expect(courantTenant.translations).toEqual({
      lng: 'fr',
      overrides: { fr: frOverridden },
    });
    expect(courantTenant.dateLocale).toBe(fr);
  });

  it('overrides the components the app overrode', () => {
    expect(courantTenant.builder).toEqual(
      expect.objectContaining({
        ContentWrapper: CourantContentWrapper,
        Navbar: CourantNavbar,
        Footer: CourantFooter,
      })
    );
    expect(courantTenant.builder.elements?.Link).toBeDefined();
    expect(courantTenant.builder.blocks).toBeUndefined();
    expect(courantTenant.blockStyles).toBeUndefined();
  });

  it('does not inject next specific builder props', () => {
    expect(courantTenant.builder).not.toHaveProperty('Head');
    expect(courantTenant.builder).not.toHaveProperty('Script');
    expect(courantTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the Courant way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(courantTenant.builder.date?.format?.(date)).toBe(
      '05. janvier 2024 à 09:07'
    );
    expect(courantTenant.builder.date?.format?.(date, false)).toBe(
      '05. janvier 2024'
    );
  });
});

const settingsTheme = websiteSettings.theme as unknown as ThemeOptions;

const courantWithSettings = {
  ...courantTenant,
  createTheme: () => courantTenant.createTheme(settingsTheme),
};

const TenantPage = () => {
  const {
    ContentWrapper,
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return (
    <ContentWrapper>
      <Button
        variant="contained"
        color="primary"
      >
        Abonner
      </Button>

      <Blocks
        blocks={[
          mockTitleBlock({ title: 'Ce qui fait bouger Genève cette semaine' }),
        ]}
        type="Page"
      />
    </ContentWrapper>
  );
};

describe('a page rendered with the Courant tenant and its website settings', () => {
  it('uses the primary colour from the website settings', () => {
    renderWithProviders(<TenantPage />, { tenant: courantWithSettings });

    expect(
      getComputedStyle(screen.getByRole('button', { name: 'Abonner' }))
        .backgroundColor
    ).toBe(websiteSettings.theme.palette.primary.main);
  });

  it('sets the block titles in the font from the website settings', () => {
    renderWithProviders(<TenantPage />, { tenant: courantWithSettings });

    expect(
      getComputedStyle(
        screen.getByRole('heading', {
          name: 'Ce qui fait bouger Genève cette semaine',
        })
      ).fontFamily
    ).toContain('Playfair Display');
  });
});
